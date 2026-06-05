import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type ActivityRepository,
    type ActivityWithRelations,
    type ListActivitiesParams,
} from '@/modules/activities/domain/ports/activity-repository.port';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import {
    EstadoActividad as PrismaEstadoActividad,
    TipoActividad as PrismaTipoActividad,
    Prisma,
} from '@prisma/client';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityMapper } from '@/modules/activities/infrastructure/mappers/activity.mapper';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

type PrismaActivityWithRelations = Prisma.ActividadGetPayload<{
    include: {
        lead: { select: { servicioInteres: true; estado: true } };
        responsable: { select: { nombres: true; apellidos: true } };
    };
}>;

@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
    constructor(private readonly prisma: PrismaService) {}

    private mapToActivityWithRelations(
        record: PrismaActivityWithRelations,
    ): ActivityWithRelations {
        return {
            activity: ActivityMapper.toDomain(record),
            leadServicioInteres: record.lead?.servicioInteres ?? '',
            leadEstado: record.lead?.estado ?? '',
            responsableNombre: record.responsable?.nombres ?? '',
            responsableApellidos: record.responsable?.apellidos ?? '',
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
        context?: { operation: string; activityId?: number | null },
    ): never {
        if (this.isPrismaError(error) && error.code === 'P2003') {
            const fieldMatch = error.message.match(/field: `(\w+)`/);
            const field = fieldMatch?.[1];

            switch (field) {
                case 'idLead':
                    throw new ActivityNotFoundException(`Lead no encontrado`);
                case 'idResponsable':
                    throw new ActivityNotFoundException(
                        `Responsable no encontrado`,
                    );
                default:
                    throw new ActivityNotFoundException(
                        `Restricción de clave foránea en el campo ${field ?? 'desconocido'}`,
                    );
            }
        }

        if (this.isPrismaError(error) && error.code === 'P2025') {
            throw new ActivityNotFoundException(
                context?.activityId
                    ? `Actividad con id ${context.activityId} no encontrada`
                    : 'Registro no encontrado',
            );
        }

        throw error;
    }

    async findById(id: number): Promise<Actividad | null> {
        try {
            const record = await this.prisma.actividad.findFirst({
                where: { id, deletedAt: null },
            });
            return record ? ActivityMapper.toDomain(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByIdWithRelations(
        id: number,
    ): Promise<ActivityWithRelations | null> {
        try {
            const record = await this.prisma.actividad.findFirst({
                where: { id, deletedAt: null },
                include: {
                    lead: { select: { servicioInteres: true, estado: true } },
                    responsable: { select: { nombres: true, apellidos: true } },
                },
            });
            return record ? this.mapToActivityWithRelations(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findPendingByLead(idLead: number): Promise<Actividad | null> {
        try {
            const record = await this.prisma.actividad.findFirst({
                where: {
                    idLead,
                    estado: PrismaEstadoActividad.PENDIENTE,
                    deletedAt: null,
                },
                orderBy: { createdAt: 'desc' },
            });
            return record ? ActivityMapper.toDomain(record) : null;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    private parseEstado(estado?: string): PrismaEstadoActividad | undefined {
        if (!estado) {
            return undefined;
        }

        return Object.values(EstadoActividad).includes(
            estado as EstadoActividad,
        )
            ? ActivityMapper.mapStateToPrisma(estado as EstadoActividad)
            : undefined;
    }

    private parseTipo(tipo?: string): PrismaTipoActividad | undefined {
        if (!tipo) {
            return undefined;
        }

        return Object.values(TipoActividad).includes(tipo as TipoActividad)
            ? ActivityMapper.mapTypeToPrisma(tipo as TipoActividad)
            : undefined;
    }

    private buildWhere(
        params?: Omit<ListActivitiesParams, 'page' | 'limit'>,
    ): Prisma.ActividadWhereInput {
        const where: Prisma.ActividadWhereInput = {
            deletedAt: null,
        };

        if (params?.idLead) {
            where.idLead = params.idLead;
        }
        if (params?.idResponsable) {
            where.idResponsable = params.idResponsable;
        }

        const estado = this.parseEstado(params?.estado);
        if (estado) {
            where.estado = estado;
        }

        const tipo = this.parseTipo(params?.tipo);
        if (tipo) {
            where.tipo = tipo;
        }

        if (params?.fechaInicio || params?.fechaFin) {
            const fechaInicio: Prisma.DateTimeFilter = {};
            if (params.fechaInicio) {
                fechaInicio.gte = params.fechaInicio;
            }
            if (params.fechaFin) {
                fechaInicio.lte = params.fechaFin;
            }
            where.fechaInicio = fechaInicio;
        }

        return where;
    }

    async save(activity: Actividad): Promise<Actividad> {
        const data = ActivityMapper.toPersistence(activity);

        try {
            if (activity.id === 0) {
                const created = await this.prisma.actividad.create({ data });
                return ActivityMapper.toDomain(created);
            }

            const updated = await this.prisma.actividad.update({
                where: { id: activity.id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
            return ActivityMapper.toDomain(updated);
        } catch (error) {
            this.handlePrismaError(error, {
                operation: activity.id === 0 ? 'create' : 'update',
                activityId: activity.id,
            });
        }
    }

    async saveWithRelations(
        activity: Actividad,
    ): Promise<ActivityWithRelations> {
        try {
            const saved = await this.save(activity);
            const enriched = await this.findByIdWithRelations(saved.id);
            if (!enriched) {
                throw new ActivityNotFoundException(
                    `Actividad con id ${saved.id} no encontrada después de guardar`,
                );
            }
            return enriched;
        } catch (error) {
            this.handlePrismaError(error, {
                operation: 'saveWithRelations',
                activityId: activity.id,
            });
        }
    }

    async list(
        params?: ListActivitiesParams,
    ): Promise<ActivityWithRelations[]> {
        try {
            const page = params?.page ?? 1;
            const limit = params?.limit ?? 10;
            const where = this.buildWhere(params);

            const records = await this.prisma.actividad.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { fechaInicio: 'desc' },
                include: {
                    lead: { select: { servicioInteres: true, estado: true } },
                    responsable: { select: { nombres: true, apellidos: true } },
                },
            });

            return records.map((record) =>
                this.mapToActivityWithRelations(record),
            );
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async count(
        params?: Omit<ListActivitiesParams, 'page' | 'limit'>,
    ): Promise<number> {
        try {
            const where = this.buildWhere(params);
            return await this.prisma.actividad.count({ where });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }
}
