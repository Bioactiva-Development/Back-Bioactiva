import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type CotizacionRepositoryPort,
    type CotizacionWithRelations,
    type ListCotizacionesParams,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot as PrismaEstadoCot, Prisma } from '@prisma/client';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { CotizacionMapper } from '@/modules/quotations/infrastructure/mappers/cotizacion.mapper';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';

type PrismaCotizacionWithRelations = Prisma.CotizacionGetPayload<{
    include: {
        lead: { select: { servicioInteres: true; estado: true } };
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

    async findByIdWithRelations(
        id: number,
    ): Promise<CotizacionWithRelations | null> {
        try {
            const record = await this.prisma.cotizacion.findFirst({
                where: { id, deletedAt: null },
                include: {
                    lead: { select: { servicioInteres: true, estado: true } },
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

    private buildWhere(
        params?: Omit<ListCotizacionesParams, 'page' | 'limit'>,
    ): Prisma.CotizacionWhereInput {
        const where: Prisma.CotizacionWhereInput = {
            deletedAt: null,
        };

        if (params?.idLead) {
            where.idLead = params.idLead;
        }

        const estado = this.parseEstado(params?.estado);
        if (estado) {
            where.estado = estado;
        }

        if (params?.idRemitente) {
            where.idRemitente = params.idRemitente;
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

    async acceptAndUpdateLead(
        cotizacionId: number,
        leadId: number,
    ): Promise<CotizacionWithRelations> {
        try {
            const [updated] = await this.prisma.$transaction([
                this.prisma.cotizacion.update({
                    where: { id: cotizacionId },
                    data: {
                        estado: 'ACEPTADA',
                        updatedAt: new Date(),
                    },
                    include: {
                        lead: {
                            select: { servicioInteres: true, estado: true },
                        },
                        remitente: {
                            select: { nombres: true, apellidos: true },
                        },
                    },
                }),
                this.prisma.lead.update({
                    where: { id: leadId },
                    data: {
                        estado: 'CIERRE_CON_VENTA',
                        updatedAt: new Date(),
                        ultimoCambioEstado: new Date(),
                    },
                }),
            ]);
            return this.mapToCotizacionWithRelations(updated);
        } catch (error) {
            this.handlePrismaError(error, {
                operation: 'acceptAndUpdateLead',
                cotizacionId: cotizacionId,
            });
        }
    }

    async rejectAndUpdateLead(
        cotizacionId: number,
        leadId: number,
    ): Promise<CotizacionWithRelations> {
        try {
            const [updated] = await this.prisma.$transaction([
                this.prisma.cotizacion.update({
                    where: { id: cotizacionId },
                    data: {
                        estado: 'RECHAZADA',
                        updatedAt: new Date(),
                    },
                    include: {
                        lead: {
                            select: { servicioInteres: true, estado: true },
                        },
                        remitente: {
                            select: { nombres: true, apellidos: true },
                        },
                    },
                }),
                this.prisma.lead.update({
                    where: { id: leadId },
                    data: {
                        estado: 'CIERRE_SIN_VENTA',
                        updatedAt: new Date(),
                        ultimoCambioEstado: new Date(),
                    },
                }),
            ]);
            return this.mapToCotizacionWithRelations(updated);
        } catch (error) {
            this.handlePrismaError(error, {
                operation: 'rejectAndUpdateLead',
                cotizacionId: cotizacionId,
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
                    lead: { select: { servicioInteres: true, estado: true } },
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
}
