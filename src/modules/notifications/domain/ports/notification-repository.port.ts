import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface ListNotificationsFilter {
    estado?: NotificationStatus;
    idLead?: number;
    idResponsable?: number;
    page?: number;
    limit?: number;
}

export interface NotificationRepositoryPort {
    save(notification: ScheduledNotification): Promise<ScheduledNotification>;
    findById(id: number): Promise<ScheduledNotification | null>;
    /** Notificación en estado PROGRAMADA asociada a la actividad, si existe. */
    findActiveByActivity(
        idActividad: number,
    ): Promise<ScheduledNotification | null>;
    /** Seguimiento (agregado completo) que contiene la instancia indicada. */
    findByInstanceId(
        instanciaId: number,
    ): Promise<ScheduledNotification | null>;
    list(filter: ListNotificationsFilter): Promise<ScheduledNotification[]>;
    count(
        filter: Omit<ListNotificationsFilter, 'page' | 'limit'>,
    ): Promise<number>;
}
