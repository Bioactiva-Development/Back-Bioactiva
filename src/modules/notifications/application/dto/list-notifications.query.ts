import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

export interface ListNotificationsQuery {
    estado?: NotificationStatus;
    idLead?: number;
    idResponsable?: number;
}
