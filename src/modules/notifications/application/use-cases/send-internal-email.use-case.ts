import { Logger } from '@nestjs/common';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    NOTIFICATION_REPOSITORY,
    type NotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/notification-repository.port';
import {
    NOTIFICATION_MAILER,
    type NotificationMailerPort,
} from '@/modules/notifications/domain/ports/notification-mailer.port';
import {
    ACTIVITY_CONTEXT_READER,
    type ActivityContextReaderPort,
} from '@/modules/notifications/domain/ports/activity-context-reader.port';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { renderNotificationInternalEmail } from '@/modules/common/mail/notification-internal-email.renderer';

export class SendInternalEmailUseCase {
    private readonly logger = new Logger(SendInternalEmailUseCase.name);

    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: NotificationRepositoryPort,
        @Inject(NOTIFICATION_MAILER)
        private readonly mailer: NotificationMailerPort,
        @Inject(ACTIVITY_CONTEXT_READER)
        private readonly activityContextReader: ActivityContextReaderPort,
    ) {}

    async execute(notificationId: number): Promise<void> {
        const notification =
            await this.notificationRepository.findById(notificationId);
        if (
            !notification ||
            notification.estado !== NotificationStatus.PROGRAMADA ||
            notification.enviado_interno
        ) {
            return;
        }

        if (
            notification.asunto_interno === null ||
            notification.cuerpo_interno === null
        ) {
            this.logger.warn(
                `Recordatorio ${notificationId} sin contenido interno; se omite`,
            );
            return;
        }

        const email = await this.activityContextReader.getUserEmail(
            notification.id_responsable,
        );
        if (!email) {
            this.logger.warn(
                `No se encontró correo del responsable ${notification.id_responsable} para la notificación ${notificationId}`,
            );
            return;
        }

        const leadLink = `${process.env.FRONTEND_URL}/pipeline/${notification.id_lead}`;

        await this.mailer.send({
            to: email,
            subject: notification.asunto_interno,
            html: renderNotificationInternalEmail({
                subject: notification.asunto_interno,
                bodyHtml: notification.cuerpo_interno,
                leadLink,
            }),
        });

        notification.markInternalSent();
        await this.notificationRepository.save(notification);
    }
}
