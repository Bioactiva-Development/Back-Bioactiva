import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import {
    type ListNotificationsFilter,
    type NotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/notification-repository.port';
import { NotificationMapper } from '@/modules/notifications/infrastructure/persistance/mappers/notification.mapper';
import { FollowUpInstanceMapper } from '@/modules/notifications/infrastructure/persistance/mappers/follow-up-instance.mapper';

const includeInstancias = {
    instancias: { orderBy: { orden: 'asc' } },
} as const;

@Injectable()
export class PrismaNotificationRepository implements NotificationRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    async save(
        notification: ScheduledNotification,
    ): Promise<ScheduledNotification> {
        if (notification.id === null) {
            const created = await this.prisma.notificacionProgramada.create({
                data: NotificationMapper.toCreateData(notification),
                include: includeInstancias,
            });
            return NotificationMapper.toDomain(created);
        }

        const notificationId = notification.id;
        await this.prisma.$transaction([
            this.prisma.notificacionProgramada.update({
                where: { id: notificationId },
                data: NotificationMapper.toUpdateData(notification),
            }),
            ...notification.instancias.map((instancia) =>
                instancia.id === null
                    ? this.prisma.seguimientoInstancia.create({
                          data: {
                              idNotificacion: notificationId,
                              ...FollowUpInstanceMapper.toCreateData(instancia),
                          },
                      })
                    : this.prisma.seguimientoInstancia.update({
                          where: { id: instancia.id },
                          data: FollowUpInstanceMapper.toUpdateData(instancia),
                      }),
            ),
        ]);

        const updated =
            await this.prisma.notificacionProgramada.findUniqueOrThrow({
                where: { id: notificationId },
                include: includeInstancias,
            });
        return NotificationMapper.toDomain(updated);
    }

    async findById(id: number): Promise<ScheduledNotification | null> {
        const record = await this.prisma.notificacionProgramada.findUnique({
            where: { id },
            include: includeInstancias,
        });
        return record ? NotificationMapper.toDomain(record) : null;
    }

    async findActiveByActivity(
        idActividad: number,
    ): Promise<ScheduledNotification | null> {
        const record = await this.prisma.notificacionProgramada.findFirst({
            where: {
                idActividad,
                estado: NotificationStatus.PROGRAMADA,
            },
            include: includeInstancias,
        });
        return record ? NotificationMapper.toDomain(record) : null;
    }

    async findByInstanceId(
        instanciaId: number,
    ): Promise<ScheduledNotification | null> {
        const instancia = await this.prisma.seguimientoInstancia.findUnique({
            where: { id: instanciaId },
            select: { idNotificacion: true },
        });
        return instancia ? this.findById(instancia.idNotificacion) : null;
    }

    async list(
        filter: ListNotificationsFilter,
    ): Promise<ScheduledNotification[]> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 10;
        const records = await this.prisma.notificacionProgramada.findMany({
            where: this.buildWhere(filter),
            include: includeInstancias,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return records.map((record) => NotificationMapper.toDomain(record));
    }

    async count(
        filter: Omit<ListNotificationsFilter, 'page' | 'limit'>,
    ): Promise<number> {
        return this.prisma.notificacionProgramada.count({
            where: this.buildWhere(filter),
        });
    }

    private buildWhere(
        filter: Omit<ListNotificationsFilter, 'page' | 'limit'>,
    ) {
        return {
            // Las canceladas nunca se muestran en el historial (CU007).
            estado: filter.estado ?? {
                in: [
                    NotificationStatus.PROGRAMADA,
                    NotificationStatus.VENCIDA,
                ],
            },
            idLead: filter.idLead,
            idResponsable: filter.idResponsable,
        };
    }
}
