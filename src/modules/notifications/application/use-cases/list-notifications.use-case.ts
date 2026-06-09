import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    NOTIFICATION_REPOSITORY,
    type NotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/notification-repository.port';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { ListNotificationsQuery } from '@/modules/notifications/application/dto/list-notifications.query';

export class ListNotificationsUseCase {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: NotificationRepositoryPort,
    ) {}

    async execute(
        query: ListNotificationsQuery,
    ): Promise<ScheduledNotification[]> {
        return this.notificationRepository.list({
            estado: query.estado,
            idLead: query.idLead,
            idResponsable: query.idResponsable,
        });
    }
}
