import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import {
    type ListNotificationsFilter,
    type NotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/notification-repository.port';
import { NotificationMapper } from '@/modules/notifications/infrastructure/persistance/mappers/notification.mapper';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    async save(
        notification: ScheduledNotification,
    ): Promise<ScheduledNotification> {
        if (notification.id === null) {
            const created = await this.prisma.notificacionProgramada.create({
                data: NotificationMapper.toCreateData(notification),
            });
            return NotificationMapper.toDomain(created);
        }

        const updated = await this.prisma.notificacionProgramada.update({
            where: { id: notification.id },
            data: NotificationMapper.toUpdateData(notification),
        });
        return NotificationMapper.toDomain(updated);
    }

    async findById(id: number): Promise<ScheduledNotification | null> {
        const record = await this.prisma.notificacionProgramada.findUnique({
            where: { id },
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
        });
        return record ? NotificationMapper.toDomain(record) : null;
    }

    async list(
        filter: ListNotificationsFilter,
    ): Promise<ScheduledNotification[]> {
        const records = await this.prisma.notificacionProgramada.findMany({
            where: {
                // Las canceladas nunca se muestran en el historial (CU007).
                estado: filter.estado ?? {
                    in: [
                        NotificationStatus.PROGRAMADA,
                        NotificationStatus.VENCIDA,
                    ],
                },
                idLead: filter.idLead,
                idResponsable: filter.idResponsable,
            },
            orderBy: { fechaEnvioInterno: 'asc' },
        });
        return records.map((record) => NotificationMapper.toDomain(record));
    }
}
