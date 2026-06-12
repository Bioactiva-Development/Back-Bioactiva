import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    IN_APP_NOTIFICATION_REPOSITORY,
    type InAppNotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/in-app-notification-repository.port';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationNotFoundException } from '@/modules/notifications/domain/exceptions/in-app-notification-not-found.exception';

export class MarkInAppNotificationReadUseCase {
    constructor(
        @Inject(IN_APP_NOTIFICATION_REPOSITORY)
        private readonly inAppNotificationRepository: InAppNotificationRepositoryPort,
    ) {}

    async execute(id: number, idUsuario: number): Promise<InAppNotification> {
        const notification =
            await this.inAppNotificationRepository.findById(id);
        if (!notification || notification.id_usuario !== idUsuario) {
            throw new InAppNotificationNotFoundException(
                `Notificación in-app con id ${id} no encontrada`,
            );
        }

        notification.markAsRead();
        return this.inAppNotificationRepository.save(notification);
    }
}
