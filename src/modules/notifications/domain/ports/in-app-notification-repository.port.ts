import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';

export const IN_APP_NOTIFICATION_REPOSITORY = Symbol(
    'IN_APP_NOTIFICATION_REPOSITORY',
);

export interface InAppNotificationRepositoryPort {
    create(notification: InAppNotification): Promise<InAppNotification>;
    /** Inserta varias notificaciones en una sola operación; devuelve cuántas creó. */
    createMany(notifications: InAppNotification[]): Promise<number>;
    save(notification: InAppNotification): Promise<InAppNotification>;
    findById(id: number): Promise<InAppNotification | null>;
    listByUser(idUsuario: number): Promise<InAppNotification[]>;
    /**
     * De entre `idLeads`, devuelve los que ya tienen al menos una alerta en los
     * últimos `sinceDays` días. Una sola consulta para evitar el N+1.
     */
    findLeadIdsWithRecentAlert(
        idLeads: number[],
        sinceDays: number,
    ): Promise<number[]>;
}
