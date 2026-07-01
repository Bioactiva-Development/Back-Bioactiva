import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type CotizacionActiva,
    type LeadRepository,
    type LeadWithRelations,
    type ListLeadsParams,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { Lead } from '@/modules/leads/domain/entities/lead';
import {
    EstadoActividad as PrismaEstadoActividad,
    EstadoCot as PrismaEstadoCot,
    LeadState as PrismaLeadState,
    Sector as PrismaSector,
    TipoEmpresa as PrismaTipoEmpresa,
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

const PENDING_ACTIVITIES_INCLUDE = {
    where: { deletedAt: null, estado: PrismaEstadoActividad.PENDIENTE },
    select: { fechaFin: true },
} as const;

// Cotizaciones no rechazadas ni eliminadas — a lo sumo 1 por lead (invariante de negocio).
const ACTIVE_COTIZACION_INCLUDE = {
    where: { deletedAt: null, estado: { not: PrismaEstadoCot.RECHAZADA } },
    select: { id: true, monto: true, tipo: true, estado: true },
} as const;

// Orden de prioridad para elegir la cotización activa cuando hubiera varias.
const COTIZACION_PRIORITY: Record<string, number> = {
    ACEPTADA: 0,
    ENVIADA: 1,
    PENDIENTE: 2,
};

type PrismaLeadWithRelations = Prisma.LeadGetPayload<{
    include: {
        organizacion: { select: { nombre: true } };
        encargado: { select: { nombres: true; apellidos: true } };
        contacto: { select: { nombres: true; apellidos: true } };
        actividades: { select: { fechaFin: true } };
        cotizaciones: {
            select: { id: true; monto: true; tipo: true; estado: true };
        };
    };
}>;

@Injectable()
export class PrismaLeadRepository implements LeadRepository {
    constructor(private readonly prisma: PrismaService) {}

    private pickCotizacionActiva(
        cotizaciones: PrismaLeadWithRelations['cotizaciones'],
    ): CotizacionActiva | null {
        if (!cotizaciones?.length) return null;
        const best = cotizaciones.reduce((a, b) =>
            (COTIZACION_PRIORITY[a.estado] ?? 99) <=
            (COTIZACION_PRIORITY[b.estado] ?? 99)
                ? a
                : b,
        );
        return { id: best.id, monto: Number(best.monto), tipo: best.tipo, estado: best.estado };
    }

    private mapToLeadWithRelations(
        record: PrismaLeadWithRelations,
        now: Date = new Date(),
    ): LeadWithRelations {
        const pendingActivities = (record.actividades ?? []).map(
            (actividad) => ({ fechaFin: actividad.fechaFin }),
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
            cotizacionActiva: this.pickCotizacionActiva(record.cotizaciones),
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
                    cotizaciones: ACTIVE_COTIZACION_INCLUDE,
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
        if (params?.idContacto) {
            where.idContacto = params.idContacto;
        }
        if (params?.search) {
            where.servicioInteres = {
                contains: params.search,
                mode: 'insensitive',
            };
        }
        if (params?.sector || params?.tipo) {
            const orgFilter: Prisma.OrganizacionWhereInput = {
                deletedAt: null,
            };
            if (params?.sector) {
                orgFilter.sector = params.sector as PrismaSector;
            }
            if (params?.tipo) {
                orgFilter.tipo = params.tipo as PrismaTipoEmpresa;
            }
            where.organizacion = orgFilter;
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
        if (params?.conActividadesPendientes) {
            where.actividades = {
                some: {
                    deletedAt: null,
                    estado: PrismaEstadoActividad.PENDIENTE,
                },
            };
        }
        // alertaActividad es más específico: si llega, sobrescribe el filtro
        // anterior de actividades pendientes.
        this.applyActivityAlertFilter(where, params?.alertaActividad, now);

        return where;
    }

    /**
     * Traduce el filtro del semáforo a condiciones sobre las actividades
     * PENDIENTES del lead, alineadas con computeActivityAlert (severidad
     * POR_VENCER > PENDIENTE > SIN_ACTIVIDADES):
     * - SIN_ACTIVIDADES: sin actividades pendientes.
     * - PENDIENTE: tiene pendientes, pero ninguna vence en ≤2 días.
     * - POR_VENCER: alguna pendiente vence en ≤2 días (incluye vencidas).
     */
    private applyActivityAlertFilter(
        where: Prisma.LeadWhereInput,
        filter: ActivityAlertLevel | undefined,
        now: Date,
    ): void {
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
        const dueSoon = { ...pending, fechaFin: { lte: dueSoonCutoff } };

        switch (filter) {
            case ActivityAlertLevel.SIN_ACTIVIDADES:
                where.actividades = { none: pending };
                break;
            case ActivityAlertLevel.POR_VENCER:
                where.actividades = { some: dueSoon };
                break;
            case ActivityAlertLevel.PENDIENTE:
                where.actividades = { some: pending, none: dueSoon };
                break;
        }
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
                // Primero los leads con movimiento más reciente. id desc desempata
                // de forma determinista cuando comparten ultimoCambioEstado
                // (p. ej. importaciones masivas con la misma fecha).
                orderBy: [{ ultimoCambioEstado: 'desc' }, { id: 'desc' }],
                include: {
                    organizacion: { select: { nombre: true } },
                    encargado: { select: { nombres: true, apellidos: true } },
                    contacto: { select: { nombres: true, apellidos: true } },
                    actividades: PENDING_ACTIVITIES_INCLUDE,
                    cotizaciones: ACTIVE_COTIZACION_INCLUDE,
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
