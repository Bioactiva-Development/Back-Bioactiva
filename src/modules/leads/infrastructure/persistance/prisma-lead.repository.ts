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
    Sector as PrismaSector,
    Prisma,
} from '@prisma/client';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';
import { LeadMapper } from '@/modules/leads/infrastructure/mappers/lead.mapper';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import {
    computeActivityAlert,
    ACTIVITY_ALERT_DUE_SOON_DAYS,
} from '@/modules/leads/domain/services/activity-alert';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Solo las actividades pendientes y no eliminadas determinan el semáforo; se
 * traen su fecha de creación y de fin (EN_RIESGO depende de ambas).
 */
const PENDING_ACTIVITIES_INCLUDE = {
    where: { deletedAt: null, estado: PrismaEstadoActividad.PENDIENTE },
    select: { createdAt: true, fechaFin: true },
} as const;

type PrismaLeadWithRelations = Prisma.LeadGetPayload<{
    include: {
        organizacion: { select: { nombre: true } };
        encargado: { select: { nombres: true; apellidos: true } };
        contacto: { select: { nombres: true; apellidos: true } };
        actividades: { select: { createdAt: true; fechaFin: true } };
    };
}>;

@Injectable()
export class PrismaLeadRepository implements LeadRepository {
    constructor(private readonly prisma: PrismaService) {}

    private mapToLeadWithRelations(
        record: PrismaLeadWithRelations,
        now: Date = new Date(),
    ): LeadWithRelations {
        const pendingActivities = (record.actividades ?? []).map(
            (actividad) => ({
                createdAt: actividad.createdAt,
                fechaFin: actividad.fechaFin,
            }),
        );

        return {
            lead: LeadMapper.toDomain(record),
            organizationName: record.organizacion?.nombre ?? '',
            encargadoNombre: record.encargado?.nombres ?? '',
            encargadoApellidos: record.encargado?.apellidos ?? '',
            contactName: record.contacto
                ? `${record.contacto.nombres} ${record.contacto.apellidos ?? ''}`.trim()
                : null,
            activityAlert: computeActivityAlert(pendingActivities, now),
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
                where: {
                    id,
                    deletedAt: null,
                    organizacion: { deletedAt: null },
                },
            });
            return record ? LeadMapper.toDomain(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByIdWithRelations(id: number): Promise<LeadWithRelations | null> {
        try {
            const record = await this.prisma.lead.findFirst({
                where: {
                    id,
                    deletedAt: null,
                    organizacion: { deletedAt: null },
                },
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

    private async buildWhere(
        params: Omit<ListLeadsParams, 'page' | 'limit'> | undefined,
        now: Date,
    ): Promise<Prisma.LeadWhereInput> {
        const where: Prisma.LeadWhereInput = {
            deletedAt: null,
            // No mostrar leads cuya organización fue eliminada (soft delete).
            organizacion: { deletedAt: null },
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
        if (params?.term || params?.sector) {
            // Se mantiene el filtro de soft-delete de la organización y se le
            // suman las condiciones por nombre (término) y/o sector.
            const organizacion: Prisma.OrganizacionWhereInput = {
                deletedAt: null,
            };
            if (params.term) {
                organizacion.OR = [
                    { nombre: { contains: params.term, mode: 'insensitive' } },
                    {
                        nombreComercial: {
                            contains: params.term,
                            mode: 'insensitive',
                        },
                    },
                ];
            }
            if (params.sector) {
                organizacion.sector = params.sector as PrismaSector;
            }
            where.organizacion = organizacion;
        }
        if (params?.fechaDesde || params?.fechaHasta) {
            const createdAt: Prisma.DateTimeFilter = {};
            if (params.fechaDesde) {
                createdAt.gte = params.fechaDesde;
            }
            if (params.fechaHasta) {
                createdAt.lte = params.fechaHasta;
            }
            where.createdAt = createdAt;
        }
        await this.applyActivityAlertFilter(where, params?.alertaActividad, now);

        return where;
    }

    /**
     * Traduce el filtro del semáforo a condiciones sobre las actividades
     * PENDIENTES del lead, alineadas con computeActivityAlert (severidad
     * POR_VENCER > EN_RIESGO > PENDIENTE > SIN_ACTIVIDADES):
     * - SIN_ACTIVIDADES: sin actividades pendientes.
     * - PENDIENTE: tiene pendientes, ninguna en riesgo ni por vencer.
     * - EN_RIESGO: alguna pendiente pasó la mitad de su tiempo, ninguna por vencer.
     * - POR_VENCER: alguna pendiente vence en ≤4 días (incluye vencidas).
     */
    private async applyActivityAlertFilter(
        where: Prisma.LeadWhereInput,
        filter: ActivityAlertLevel | undefined,
        now: Date,
    ): Promise<void> {
        if (!filter) {
            return;
        }

        const dueSoonCutoff = new Date(
            now.getTime() + ACTIVITY_ALERT_DUE_SOON_DAYS * MS_PER_DAY,
        );
        const pending = {
            deletedAt: null,
            estado: PrismaEstadoActividad.PENDIENTE,
        };
        // "Por vencer" incluye vencidas: fechaFin <= ahora + umbral.
        const dueSoon = { ...pending, fechaFin: { lte: dueSoonCutoff } };

        switch (filter) {
            case ActivityAlertLevel.SIN_ACTIVIDADES:
                // Sin actividades pendientes.
                where.actividades = { none: pending };
                break;
            case ActivityAlertLevel.POR_VENCER:
                // Alguna pendiente vencida o próxima a vencer.
                where.actividades = { some: dueSoon };
                break;
            case ActivityAlertLevel.EN_RIESGO: {
                // Alguna pendiente pasó el punto medio, pero ninguna por vencer.
                const ids = await this.leadIdsWithMidpointPassedActivity(now);
                where.id = { in: ids };
                where.actividades = { none: dueSoon };
                break;
            }
            case ActivityAlertLevel.PENDIENTE: {
                // Tiene pendientes, pero ninguna en riesgo ni por vencer.
                const ids = await this.leadIdsWithMidpointPassedActivity(now);
                where.id = { notIn: ids };
                where.actividades = { some: pending, none: dueSoon };
                break;
            }
        }
    }

    /**
     * IDs de leads con alguna actividad PENDIENTE que ya superó la mitad de su
     * tiempo disponible (createdAt + (fechaFin - createdAt) / 2 <= ahora). La
     * comparación involucra dos columnas, algo no expresable en el `where` de
     * Prisma, por lo que se resuelve en SQL.
     */
    private async leadIdsWithMidpointPassedActivity(
        now: Date,
    ): Promise<number[]> {
        const rows = await this.prisma.$queryRaw<{ idLead: number }[]>`
            SELECT DISTINCT "idLead"
            FROM "Actividad"
            WHERE "deletedAt" IS NULL
              AND "estado" = 'PENDIENTE'
              AND "createdAt" + ("fechaFin" - "createdAt") / 2 <= ${now}
        `;
        return rows.map((row) => row.idLead);
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
            const now = new Date();
            const where = await this.buildWhere(params, now);

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

            return records.map((record) =>
                this.mapToLeadWithRelations(record, now),
            );
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async count(
        params?: Omit<ListLeadsParams, 'page' | 'limit'>,
    ): Promise<number> {
        try {
            const where = await this.buildWhere(params, new Date());
            return await this.prisma.lead.count({ where });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async hasPendingActivities(leadId: number): Promise<boolean> {
        try {
            const pending = await this.prisma.actividad.count({
                where: {
                    idLead: leadId,
                    deletedAt: null,
                    estado: PrismaEstadoActividad.PENDIENTE,
                },
            });
            return pending > 0;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }
}
