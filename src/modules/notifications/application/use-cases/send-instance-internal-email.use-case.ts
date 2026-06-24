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

/**
 * Envío del correo interno de una instancia de seguimiento al responsable de la
 * actividad. Lo dispara el job `send-instance-internal`.
 */
export class SendInstanceInternalEmailUseCase {
    private readonly logger = new Logger(SendInstanceInternalEmailUseCase.name);

    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: NotificationRepositoryPort,
        @Inject(NOTIFICATION_MAILER)
        private readonly mailer: NotificationMailerPort,
        @Inject(ACTIVITY_CONTEXT_READER)
        private readonly activityContextReader: ActivityContextReaderPort,
    ) {}

    async execute(instanciaId: number): Promise<void> {
        const notification =
            await this.notificationRepository.findByInstanceId(instanciaId);
        if (
            !notification ||
            notification.estado !== NotificationStatus.PROGRAMADA
        ) {
            return;
        }

        const instancia = notification.instancias.find(
            (item) => item.id === instanciaId,
        );
        if (!instancia || instancia.enviado_interno) {
            return;
        }

        const email = await this.activityContextReader.getUserEmail(
            notification.id_responsable,
        );
        if (!email) {
            this.logger.warn(
                `No se encontró correo del responsable ${notification.id_responsable} para la instancia ${instanciaId}`,
            );
            return;
        }

        const leadLink = `${process.env.FRONTEND_URL}/pipeline/${notification.id_lead}`;

        await this.mailer.send({
            to: email,
            subject: instancia.asunto_interno,
            html: renderNotificationInternalEmail({
                subject: instancia.asunto_interno,
                bodyHtml: instancia.cuerpo_interno,
                leadLink,
            }),
        });

        instancia.markInternalSent();
        await this.notificationRepository.save(notification);
    }
}
