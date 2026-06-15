import {
    NotificacionProgramada as PrismaNotificacionProgramada,
    SeguimientoInstancia as PrismaSeguimientoInstancia,
    Prisma,
} from '@prisma/client';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { FollowUpInstanceMapper } from '@/modules/notifications/infrastructure/persistance/mappers/follow-up-instance.mapper';

type NotificacionProgramadaWithInstancias = PrismaNotificacionProgramada & {
    instancias: PrismaSeguimientoInstancia[];
};

export class NotificationMapper {
    static toDomain(
        record: NotificacionProgramadaWithInstancias,
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
            record.instancias
                .slice()
                .sort((a, b) => a.orden - b.orden)
                .map((instancia) => FollowUpInstanceMapper.toDomain(instancia)),
            record.createdAt,
            record.updatedAt,
        );
    }

    static toCreateData(
        notification: ScheduledNotification,
    ): Prisma.NotificacionProgramadaCreateInput {
        return {
            tipo: notification.tipo,
            estado: notification.estado,
            actividad: { connect: { id: notification.id_actividad } },
            lead: { connect: { id: notification.id_lead } },
            responsable: { connect: { id: notification.id_responsable } },
            asuntoInterno: notification.asunto_interno,
            cuerpoInterno: notification.cuerpo_interno,
            fechaEnvioInterno: notification.fecha_envio_interno,
            idTemplateInterno: notification.id_template_interno,
            jobIdInterno: notification.job_id_interno,
            enviadoInterno: notification.enviado_interno,
            correoCliente: notification.correo_cliente,
            instancias: {
                create: notification.instancias.map((instancia) =>
                    FollowUpInstanceMapper.toCreateData(instancia),
                ),
            },
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
        };
    }
}
