import {
    NotificacionProgramada as PrismaNotificacionProgramada,
    Prisma,
} from '@prisma/client';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';

export class NotificationMapper {
    static toDomain(
        record: PrismaNotificacionProgramada,
    ): ScheduledNotification {
        return new ScheduledNotification(
            record.id,
            record.tipo as NotificationType,
            record.estado as NotificationStatus,
            record.idActividad,
            record.idLead,
            record.idResponsable,
            record.asuntoInterno,
            record.cuerpoInterno,
            record.fechaEnvioInterno,
            record.idTemplateInterno,
            record.jobIdInterno,
            record.enviadoInterno,
            record.correoCliente,
            record.asuntoExterno,
            record.cuerpoExterno,
            record.fechaEnvioExterno,
            record.idTemplateExterno,
            record.jobIdExterno,
            record.enviadoExterno,
            record.createdAt,
            record.updatedAt,
        );
    }

    static toCreateData(
        notification: ScheduledNotification,
    ): Prisma.NotificacionProgramadaUncheckedCreateInput {
        return {
            tipo: notification.tipo,
            estado: notification.estado,
            idActividad: notification.id_actividad,
            idLead: notification.id_lead,
            idResponsable: notification.id_responsable,
            asuntoInterno: notification.asunto_interno,
            cuerpoInterno: notification.cuerpo_interno,
            fechaEnvioInterno: notification.fecha_envio_interno,
            idTemplateInterno: notification.id_template_interno,
            jobIdInterno: notification.job_id_interno,
            enviadoInterno: notification.enviado_interno,
            correoCliente: notification.correo_cliente,
            asuntoExterno: notification.asunto_externo,
            cuerpoExterno: notification.cuerpo_externo,
            fechaEnvioExterno: notification.fecha_envio_externo,
            idTemplateExterno: notification.id_template_externo,
            jobIdExterno: notification.job_id_externo,
            enviadoExterno: notification.enviado_externo,
        };
    }

    static toUpdateData(
        notification: ScheduledNotification,
    ): Prisma.NotificacionProgramadaUncheckedUpdateInput {
        return {
            estado: notification.estado,
            asuntoInterno: notification.asunto_interno,
            cuerpoInterno: notification.cuerpo_interno,
            fechaEnvioInterno: notification.fecha_envio_interno,
            jobIdInterno: notification.job_id_interno,
            enviadoInterno: notification.enviado_interno,
            correoCliente: notification.correo_cliente,
            asuntoExterno: notification.asunto_externo,
            cuerpoExterno: notification.cuerpo_externo,
            fechaEnvioExterno: notification.fecha_envio_externo,
            jobIdExterno: notification.job_id_externo,
            enviadoExterno: notification.enviado_externo,
        };
    }
}
