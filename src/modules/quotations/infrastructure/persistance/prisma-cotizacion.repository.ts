import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type CotizacionRepositoryPort,
    type CotizacionKpis,
    type CotizacionWithRelations,
    type KpisCotizacionesParams,
    type ListCotizacionesParams,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import {
    EstadoCot as PrismaEstadoCot,
    TipoMoneda as PrismaTipoMoneda,
    Prisma,
} from '@prisma/client';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { CotizacionMapper } from '@/modules/quotations/infrastructure/mappers/cotizacion.mapper';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';
import { CotizacionConflictException } from '@/modules/quotations/domain/exceptions/cotizacion-conflict.exception';
import { LeadMapper } from '@/modules/leads/infrastructure/mappers/lead.mapper';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

type PrismaCotizacionWithRelations = Prisma.CotizacionGetPayload<{
    include: {
        lead: {
            select: {
                servicioInteres: true;
                estado: true;
                contacto: { select: { nombres: true; apellidos: true } };
            };
        };
        remitente: { select: { nombres: true; apellidos: true } };
    };
}>;

@Injectable()
export class PrismaCotizacionRepository implements CotizacionRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    private mapToCotizacionWithRelations(
        record: PrismaCotizacionWithRelations,
    ): CotizacionWithRelations {
        return {
            cotizacion: CotizacionMapper.toDomain(record),
            leadServicioInteres: record.lead?.servicioInteres ?? '',
            leadEstado: record.lead?.estado ?? '',
            contactName: record.lead?.contacto
                ? `${record.lead.contacto.nombres} ${record.lead.contacto.apellidos ?? ''}`.trim()
                : '',
            remitenteNombre: record.remitente?.nombres ?? '',
            remitenteApellidos: record.remitente?.apellidos ?? '',
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
        context?: { operation: string; cotizacionId?: number | null },
    ): never {
        if (this.isPrismaError(error) && error.code === 'P2003') {
            const fieldMatch = error.message.match(/field: `(\w+)`/);
            const field = fieldMatch?.[1];

            switch (field) {
                case 'idLead':
                    throw new CotizacionNotFoundException(`Lead no encontrado`);
                case 'idRemitente':
                    throw new CotizacionNotFoundException(
                        `Remitente no encontrado`,
                    );
                default:
                    throw new CotizacionNotFoundException(
                        `Restricción de clave foránea en el campo ${field ?? 'desconocido'}`,
                    );
            }
        }

        if (this.isPrismaError(error) && error.code === 'P2025') {
            throw new CotizacionNotFoundException(
                context?.cotizacionId
                    ? `Cotización con id ${context.cotizacionId} no encontrada`
                    : 'Registro no encontrado',
            );
        }

        throw error;
    }

    async findById(id: number): Promise<Cotizacion | null> {
        try {
            const record = await this.prisma.cotizacion.findFirst({
                where: { id, deletedAt: null },
            });
            return record ? CotizacionMapper.toDomain(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByLead(leadId: number): Promise<Cotizacion | null> {
        try {
            const record = await this.prisma.cotizacion.findFirst({
                where: { idLead: leadId, deletedAt: null },
            });
            return record ? CotizacionMapper.toDomain(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByIdWithRelations(
        id: number,
    ): Promise<CotizacionWithRelations | null> {
        try {
            const record = await this.prisma.cotizacion.findFirst({
                where: { id, deletedAt: null },
                include: {
                    lead: {
                        select: {
                            servicioInteres: true,
                            estado: true,
                            contacto: {
                                select: { nombres: true, apellidos: true },
                            },
                        },
                    },
                    remitente: { select: { nombres: true, apellidos: true } },
                },
            });
            return record ? this.mapToCotizacionWithRelations(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    private parseEstado(estado?: string): PrismaEstadoCot | undefined {
        if (!estado) return undefined;

        return Object.values(EstadoCot).includes(estado as EstadoCot)
            ? CotizacionMapper.mapStateToPrisma(estado as EstadoCot)
            : undefined;
    }

    private parseTipo(tipo?: string): PrismaTipoMoneda | undefined {
        if (!tipo) return undefined;

        return Object.values(TipoMoneda).includes(tipo as TipoMoneda)
            ? CotizacionMapper.mapTypeToPrisma(tipo as TipoMoneda)
            : undefined;
    }

    private buildWhere(
        params?: Omit<ListCotizacionesParams, 'page' | 'limit'>,
    ): Prisma.CotizacionWhereInput {
        const where: Prisma.CotizacionWhereInput = {
            deletedAt: null,
            // No mostrar cotizaciones cuyo lead u organización fueron
            // eliminados (soft delete).
            lead: { deletedAt: null, organizacion: { deletedAt: null } },
        };

        if (params?.idLead) {
            where.idLead = params.idLead;
        }

        if (params?.idOrg) {
            // La cotización no guarda la organización: se filtra por la del lead
            // asociado a través de la relación, manteniendo el soft-delete.
            where.lead = {
                deletedAt: null,
                idOrg: params.idOrg,
                organizacion: { deletedAt: null },
            };
        }

        const estado = this.parseEstado(params?.estado);
        if (estado) {
            where.estado = estado;
        }

        if (params?.idRemitente) {
            where.idRemitente = params.idRemitente;
        }

        const tipo = this.parseTipo(params?.tipo);
        if (tipo) {
            where.tipo = tipo;
        }

        if (params?.fechaDesde || params?.fechaHasta) {
            const fechaCot: Prisma.DateTimeFilter = {};
            if (params.fechaDesde) {
                fechaCot.gte = params.fechaDesde;
            }
            if (params.fechaHasta) {
                fechaCot.lte = params.fechaHasta;
            }
            where.fechaCot = fechaCot;
        }

        return where;
    }

    async save(cotizacion: Cotizacion): Promise<Cotizacion> {
        const data = CotizacionMapper.toPersistence(cotizacion);

        try {
            if (cotizacion.id === null) {
                const created = await this.prisma.cotizacion.create({ data });
                return CotizacionMapper.toDomain(created);
            }

            const updated = await this.prisma.cotizacion.update({
                where: { id: cotizacion.id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
            return CotizacionMapper.toDomain(updated);
        } catch (error) {
            this.handlePrismaError(error, {
                operation: cotizacion.id === null ? 'create' : 'update',
                cotizacionId: cotizacion.id,
            });
        }
    }

    async saveWithRelations(
        cotizacion: Cotizacion,
    ): Promise<CotizacionWithRelations> {
        try {
            const saved = await this.save(cotizacion);
            const enriched = await this.findByIdWithRelations(saved.id!);
            if (!enriched) {
                throw new CotizacionNotFoundException(
                    `Cotización con id ${saved.id} no encontrada después de guardar`,
                );
            }
            return enriched;
        } catch (error) {
            this.handlePrismaError(error, {
                operation: 'saveWithRelations',
                cotizacionId: cotizacion.id,
            });
        }
    }

    async createAndPromoteLead(
        cotizacion: Cotizacion,
        leadId: number,
        leadState: LeadState,
    ): Promise<CotizacionWithRelations> {
        const data = CotizacionMapper.toPersistence(cotizacion);
        try {
            // Se actualiza el lead primero y luego se crea la cotización con sus
            // relaciones, de modo que el leadEstado incluido refleje ya el nuevo
            // estado. Ambas operaciones van en una sola transacción.
            const [, created] = await this.prisma.$transaction([
                this.prisma.lead.update({
                    where: { id: leadId },
                    data: {
                        estado: LeadMapper.mapStateToPrisma(leadState),
                        updatedAt: new Date(),
                        ultimoCambioEstado: new Date(),
                        // Promover a OFERTADO no sella fecha de cierre; solo los
                        // cierres con venta lo hacen (ver updateEstadoAndLead).
                        fechaCierre:
                            leadState === LeadState.CIERRE_CON_VENTA
                                ? new Date()
                                : undefined,
                    },
                }),
                this.prisma.cotizacion.create({
                    data,
                    include: {
                        lead: {
                            select: {
                                servicioInteres: true,
                                estado: true,
                                contacto: {
                                    select: { nombres: true, apellidos: true },
                                },
                            },
                        },
                        remitente: {
                            select: { nombres: true, apellidos: true },
                        },
                    },
                }),
            ]);
            return this.mapToCotizacionWithRelations(created);
        } catch (error) {
            this.handlePrismaError(error, {
                operation: 'createAndPromoteLead',
                cotizacionId: null,
            });
        }
    }

    async acceptAndUpdateLead(
        cotizacionId: number,
        leadId: number,
        leadState: LeadState,
        expectedEstado: EstadoCot,
    ): Promise<CotizacionWithRelations> {
        return this.updateEstadoAndLead(
            cotizacionId,
            leadId,
            'ACEPTADA',
            leadState,
            expectedEstado,
            'acceptAndUpdateLead',
        );
    }

    async rejectAndUpdateLead(
        cotizacionId: number,
        leadId: number,
        leadState: LeadState,
        expectedEstado: EstadoCot,
    ): Promise<CotizacionWithRelations> {
        return this.updateEstadoAndLead(
            cotizacionId,
            leadId,
            'RECHAZADA',
            leadState,
            expectedEstado,
            'rejectAndUpdateLead',
        );
    }

    private async updateEstadoAndLead(
        cotizacionId: number,
        leadId: number,
        estado: PrismaEstadoCot,
        leadState: LeadState,
        expectedEstado: EstadoCot,
        operation: string,
    ): Promise<CotizacionWithRelations> {
        try {
            const [updated] = await this.prisma.$transaction([
                this.prisma.cotizacion.update({
                    // Concurrencia optimista: solo actualiza si el estado
                    // sigue siendo el que leyó el caso de uso. Si otra
                    // operación ya lo cambió, no hay match -> P2025 -> rollback.
                    where: {
                        id: cotizacionId,
                        estado: CotizacionMapper.mapStateToPrisma(
                            expectedEstado,
                        ),
                    },
                    data: {
                        estado,
                        updatedAt: new Date(),
                    },
                    include: {
                        lead: {
                            select: {
                                servicioInteres: true,
                                estado: true,
                                contacto: {
                                    select: { nombres: true, apellidos: true },
                                },
                            },
                        },
                        remitente: {
                            select: { nombres: true, apellidos: true },
                        },
                    },
                }),
                this.prisma.lead.update({
                    where: { id: leadId },
                    data: {
                        estado: LeadMapper.mapStateToPrisma(leadState),
                        updatedAt: new Date(),
                        ultimoCambioEstado: new Date(),
                        // Solo se sella la fecha de cierre cuando la venta se
                        // concreta; otras transiciones la dejan intacta.
                        fechaCierre:
                            leadState === LeadState.CIERRE_CON_VENTA
                                ? new Date()
                                : undefined,
                    },
                }),
            ]);
            return this.mapToCotizacionWithRelations(updated);
        } catch (error) {
            if (this.isPrismaError(error) && error.code === 'P2025') {
                throw new CotizacionConflictException(
                    `La cotización con id ${cotizacionId} ya fue procesada por otra operación`,
                );
            }
            this.handlePrismaError(error, {
                operation,
                cotizacionId,
            });
        }
    }

    async list(
        params?: ListCotizacionesParams,
    ): Promise<CotizacionWithRelations[]> {
        try {
            const page = params?.page ?? 1;
            const limit = params?.limit ?? 10;
            const where = this.buildWhere(params);

            const records = await this.prisma.cotizacion.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    lead: {
                        select: {
                            servicioInteres: true,
                            estado: true,
                            contacto: {
                                select: { nombres: true, apellidos: true },
                            },
                        },
                    },
                    remitente: { select: { nombres: true, apellidos: true } },
                },
            });

            return records.map((record) =>
                this.mapToCotizacionWithRelations(record),
            );
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async count(
        params?: Omit<ListCotizacionesParams, 'page' | 'limit'>,
    ): Promise<number> {
        try {
            const where = this.buildWhere(params);
            return await this.prisma.cotizacion.count({ where });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async getKpis(params?: KpisCotizacionesParams): Promise<CotizacionKpis> {
        const baseWhere: Prisma.CotizacionWhereInput = {
            deletedAt: null,
            lead: { deletedAt: null, organizacion: { deletedAt: null } },
        };

        if (params?.fechaDesde || params?.fechaHasta) {
            const fechaCot: Prisma.DateTimeFilter = {};
            if (params.fechaDesde) fechaCot.gte = params.fechaDesde;
            if (params.fechaHasta) fechaCot.lte = params.fechaHasta;
            baseWhere.fechaCot = fechaCot;
        }

        const rows = await this.prisma.cotizacion.groupBy({
            by: ['estado'],
            where: baseWhere,
            _count: { id: true },
            _sum: { monto: true },
        });

        let totalActivo = 0;
        let aceptadas = 0;
        let enviadas = 0;
        let rechazadas = 0;

        for (const row of rows) {
            const count = row._count.id;
            const sum = Number(row._sum.monto ?? 0);
            switch (row.estado) {
                case PrismaEstadoCot.ACEPTADA:
                    aceptadas = count;
                    totalActivo += sum;
                    break;
                case PrismaEstadoCot.ENVIADA:
                    enviadas = count;
                    totalActivo += sum;
                    break;
                case PrismaEstadoCot.RECHAZADA:
                    rechazadas = count;
                    break;
                case PrismaEstadoCot.PENDIENTE:
                    totalActivo += sum;
                    break;
            }
        }

        return { totalActivo, aceptadas, enviadas, rechazadas };
    }
}
