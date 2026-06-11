import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type LeadRepository,
    type LeadWithRelations,
    type ListLeadsParams,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { Lead } from '@/modules/leads/domain/entities/lead';
import {
    EstadoActividad as PrismaEstadoActividad,
    LeadState as PrismaLeadState,
    Prisma,
} from '@prisma/client';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadMapper } from '@/modules/leads/infrastructure/mappers/lead.mapper';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import {
    computeActivityAlert,
    ACTIVITY_ALERT_YELLOW_DAYS,
} from '@/modules/leads/domain/services/activity-alert';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Solo las actividades pendientes y no eliminadas determinan el semáforo; se
 * traen únicamente sus fechas de fin para minimizar el payload.
 */
const PENDING_ACTIVITIES_INCLUDE = {
    where: { deletedAt: null, estado: PrismaEstadoActividad.PENDIENTE },
    select: { fechaFin: true },
} as const;

type PrismaLeadWithRelations = Prisma.LeadGetPayload<{
    include: {
        organizacion: { select: { nombre: true } };
        encargado: { select: { nombres: true; apellidos: true } };
        contacto: { select: { nombres: true; apellidos: true } };
        actividades: { select: { fechaFin: true } };
    };
}>;

@Injectable()
export class PrismaLeadRepository implements LeadRepository {
    constructor(private readonly prisma: PrismaService) {}

    private mapToLeadWithRelations(
        record: PrismaLeadWithRelations,
    ): LeadWithRelations {
        const pendingDueDates = (record.actividades ?? []).map(
            (actividad) => actividad.fechaFin,
        );

        return {
            lead: LeadMapper.toDomain(record),
            organizationName: record.organizacion?.nombre ?? '',
            encargadoNombre: record.encargado?.nombres ?? '',
            encargadoApellidos: record.encargado?.apellidos ?? '',
            contactName: record.contacto
                ? `${record.contacto.nombres} ${record.contacto.apellidos ?? ''}`.trim()
                : null,
            activityAlert: computeActivityAlert(pendingDueDates, new Date()),
        };
    }

    private isPrismaError(
        error: unknown,
    ): error is { code: string; message: string } {
        return (
            typeof error === 'object' &&
            error !== null &&
            (error as Error).name === 'PrismaClientKnownRequestError'
        );
    }

    private handlePrismaError(
        error: unknown,
        context?: { operation: string; leadId?: number | null },
    ): never {
        if (this.isPrismaError(error) && error.code === 'P2003') {
            const fieldMatch = error.message.match(/field: `(\w+)`/);
            const field = fieldMatch?.[1];

            switch (field) {
                case 'idOrg':
                    throw new LeadNotFoundException(
                        `Organización no encontrada`,
                    );
                case 'idContacto':
                    throw new LeadNotFoundException(`Contacto no encontrado`);
                case 'idEncargado':
                    throw new LeadNotFoundException(`Encargado no encontrado`);
                case 'idAuthor':
                    throw new LeadNotFoundException(
                        `Usuario autor no encontrado`,
                    );
                default:
                    throw new LeadNotFoundException(
                        `Restricción de clave foránea en el campo ${field ?? 'desconocido'}`,
                    );
            }
        }

        if (this.isPrismaError(error) && error.code === 'P2025') {
            throw new LeadNotFoundException(
                context?.leadId
                    ? `Lead con id ${context.leadId} no encontrado`
                    : 'Registro no encontrado',
            );
        }

        throw error;
    }

    async findById(id: number): Promise<Lead | null> {
        try {
            const record = await this.prisma.lead.findFirst({
                where: { id, deletedAt: null },
            });
            return record ? LeadMapper.toDomain(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByIdWithRelations(id: number): Promise<LeadWithRelations | null> {
        try {
            const record = await this.prisma.lead.findFirst({
                where: { id, deletedAt: null },
                include: {
                    organizacion: { select: { nombre: true } },
                    encargado: { select: { nombres: true, apellidos: true } },
                    contacto: { select: { nombres: true, apellidos: true } },
                    actividades: PENDING_ACTIVITIES_INCLUDE,
                },
            });
            return record ? this.mapToLeadWithRelations(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    private parseLeadState(state?: string): PrismaLeadState | undefined {
        if (!state) {
            return undefined;
        }

        return Object.values(LeadState).includes(state as LeadState)
            ? LeadMapper.mapStateToPrisma(state as LeadState)
            : undefined;
    }

    private buildWhere(
        params?: Omit<ListLeadsParams, 'page' | 'limit'>,
    ): Prisma.LeadWhereInput {
        const where: Prisma.LeadWhereInput = {
            deletedAt: null,
        };

        const estado = this.parseLeadState(params?.estado);
        if (estado) {
            where.estado = estado;
        }
        if (params?.idOrg) {
            where.idOrg = params.idOrg;
        }
        if (params?.idEncargado) {
            where.idEncargado = params.idEncargado;
        }
        if (params?.search) {
            where.servicioInteres = {
                contains: params.search,
                mode: 'insensitive',
            };
        }
        if (params?.conActividadesPorVencer) {
            // Amarillo o rojo: existe al menos una actividad pendiente cuya
            // fechaFin ya pasó o cae dentro del umbral de "próxima a vencer".
            const yellowCutoff = new Date(
                Date.now() + ACTIVITY_ALERT_YELLOW_DAYS * MS_PER_DAY,
            );
            where.actividades = {
                some: {
                    deletedAt: null,
                    estado: PrismaEstadoActividad.PENDIENTE,
                    fechaFin: { lte: yellowCutoff },
                },
            };
        }

        return where;
    }

    async save(lead: Lead): Promise<Lead> {
        const data = LeadMapper.toPersistence(lead);

        try {
            if (lead.id === null) {
                const created = await this.prisma.lead.create({ data });
                return LeadMapper.toDomain(created);
            }

            const updated = await this.prisma.lead.update({
                where: { id: lead.id },
                data: {
                    ...data,
                    contacto: lead.id_contacto
                        ? { connect: { id: lead.id_contacto } }
                        : { disconnect: true },
                    updatedAt: new Date(),
                },
            });
            return LeadMapper.toDomain(updated);
        } catch (error) {
            this.handlePrismaError(error, {
                operation: lead.id === null ? 'create' : 'update',
                leadId: lead.id,
            });
        }
    }

    async saveWithRelations(lead: Lead): Promise<LeadWithRelations> {
        try {
            const saved = await this.save(lead);
            const enriched = await this.findByIdWithRelations(saved.id!);
            if (!enriched) {
                throw new LeadNotFoundException(
                    `Lead con id ${saved.id} no encontrado después de guardar`,
                );
            }
            return enriched;
        } catch (error) {
            this.handlePrismaError(error, {
                operation: 'saveWithRelations',
                leadId: lead.id,
            });
        }
    }

    async list(params?: ListLeadsParams): Promise<LeadWithRelations[]> {
        try {
            const page = params?.page ?? 1;
            const limit = params?.limit ?? 10;
            const where = this.buildWhere(params);

            const records = await this.prisma.lead.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    organizacion: { select: { nombre: true } },
                    encargado: { select: { nombres: true, apellidos: true } },
                    contacto: { select: { nombres: true, apellidos: true } },
                    actividades: PENDING_ACTIVITIES_INCLUDE,
                },
            });

            return records.map((record) => this.mapToLeadWithRelations(record));
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async count(
        params?: Omit<ListLeadsParams, 'page' | 'limit'>,
    ): Promise<number> {
        try {
            const where = this.buildWhere(params);
            return await this.prisma.lead.count({ where });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }
}
