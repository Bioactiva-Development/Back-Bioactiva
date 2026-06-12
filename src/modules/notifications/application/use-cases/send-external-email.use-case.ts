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
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

export class SendExternalEmailUseCase {
    private readonly logger = new Logger(SendExternalEmailUseCase.name);

    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: NotificationRepositoryPort,
        @Inject(NOTIFICATION_MAILER)
        private readonly mailer: NotificationMailerPort,
    ) {}

    async execute(notificationId: number): Promise<void> {
        const notification =
            await this.notificationRepository.findById(notificationId);
        if (
            !notification ||
            notification.estado !== NotificationStatus.PROGRAMADA ||
            notification.enviado_externo
        ) {
            // Cancelada, ya enviada, o el responsable completó la actividad.
            return;
        }

        if (
            !notification.correo_cliente ||
            !notification.asunto_externo ||
            notification.cuerpo_externo === null
        ) {
            this.logger.warn(
                `Notificación ${notificationId} sin datos de correo externo; se omite`,
            );
            return;
        }

        await this.mailer.send({
            to: notification.correo_cliente,
            subject: notification.asunto_externo,
            html: notification.cuerpo_externo,
        });

        notification.markExternalSent();
        await this.notificationRepository.save(notification);
    }
}
