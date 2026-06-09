import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    IN_APP_NOTIFICATION_REPOSITORY,
    type InAppNotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/in-app-notification-repository.port';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';

export class ListInAppNotificationsUseCase {
    constructor(
        @Inject(IN_APP_NOTIFICATION_REPOSITORY)
        private readonly inAppNotificationRepository: InAppNotificationRepositoryPort,
    ) {}

    async execute(idUsuario: number): Promise<InAppNotification[]> {
        return this.inAppNotificationRepository.listByUser(idUsuario);
    }
}
