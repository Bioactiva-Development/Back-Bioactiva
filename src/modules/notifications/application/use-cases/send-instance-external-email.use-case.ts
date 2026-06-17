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

/**
 * Envío del correo externo de una instancia de seguimiento al cliente. Lo
 * dispara el job `send-instance-external`. Cuando todas las instancias quedan
 * enviadas, el seguimiento se cierra (VENCIDA).
 */
export class SendInstanceExternalEmailUseCase {
    private readonly logger = new Logger(SendInstanceExternalEmailUseCase.name);

    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: NotificationRepositoryPort,
        @Inject(NOTIFICATION_MAILER)
        private readonly mailer: NotificationMailerPort,
    ) {}

    async execute(instanciaId: number): Promise<void> {
        const notification =
            await this.notificationRepository.findByInstanceId(instanciaId);
        if (
            !notification ||
            notification.estado !== NotificationStatus.PROGRAMADA
        ) {
            // Cancelada, vencida, o el responsable completó la actividad.
            return;
        }

        const instancia = notification.instancias.find(
            (item) => item.id === instanciaId,
        );
        if (!instancia || instancia.enviado_externo) {
            return;
        }

        if (!notification.correo_cliente) {
            this.logger.warn(
                `Seguimiento ${notification.id} sin correo del cliente; se omite la instancia ${instanciaId}`,
            );
            return;
        }

        await this.mailer.send({
            to: notification.correo_cliente,
            subject: instancia.asunto_externo,
            html: instancia.cuerpo_externo,
        });

        instancia.markExternalSent();
        notification.closeIfAllInstancesSent();
        await this.notificationRepository.save(notification);
    }
}
