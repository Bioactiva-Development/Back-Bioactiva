import { Notificacion as PrismaNotificacion, Prisma } from '@prisma/client';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationStatus } from '@/modules/notifications/domain/enums/in-app-notification-status';

export class InAppNotificationMapper {
    static toDomain(record: PrismaNotificacion): InAppNotification {
        return new InAppNotification(
            record.id,
            record.titulo,
            record.mensaje,
            record.estado as InAppNotificationStatus,
            record.idUsuario,
            record.idActividad,
            record.idLead,
            record.createdAt,
        );
    }

    static toCreateData(
        notification: InAppNotification,
    ): Prisma.NotificacionUncheckedCreateInput {
        return {
            titulo: notification.titulo,
            mensaje: notification.mensaje,
            estado: notification.estado,
            idUsuario: notification.id_usuario,
            idActividad: notification.id_actividad,
            idLead: notification.id_lead,
        };
    }
}
