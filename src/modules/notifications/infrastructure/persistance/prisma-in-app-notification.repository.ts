import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationRepositoryPort } from '@/modules/notifications/domain/ports/in-app-notification-repository.port';
import { InAppNotificationMapper } from '@/modules/notifications/infrastructure/persistance/mappers/in-app-notification.mapper';

@Injectable()
export class PrismaInAppNotificationRepository
    implements InAppNotificationRepositoryPort
{
    constructor(private readonly prisma: PrismaService) {}

    async create(
        notification: InAppNotification,
    ): Promise<InAppNotification> {
        const created = await this.prisma.notificacion.create({
            data: InAppNotificationMapper.toCreateData(notification),
        });
        return InAppNotificationMapper.toDomain(created);
    }

    async save(notification: InAppNotification): Promise<InAppNotification> {
        const updated = await this.prisma.notificacion.update({
            where: { id: notification.id! },
            data: { estado: notification.estado },
        });
        return InAppNotificationMapper.toDomain(updated);
    }

    async findById(id: number): Promise<InAppNotification | null> {
        const record = await this.prisma.notificacion.findUnique({
            where: { id },
        });
        return record ? InAppNotificationMapper.toDomain(record) : null;
    }

    async listByUser(idUsuario: number): Promise<InAppNotification[]> {
        const records = await this.prisma.notificacion.findMany({
            where: { idUsuario },
            orderBy: { createdAt: 'desc' },
        });
        return records.map((record) =>
            InAppNotificationMapper.toDomain(record),
        );
    }

    async hasRecentLeadAlert(
        idLead: number,
        sinceDays: number,
    ): Promise<boolean> {
        const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
        const count = await this.prisma.notificacion.count({
            where: {
                idLead,
                createdAt: { gte: since },
            },
        });
        return count > 0;
    }
}
