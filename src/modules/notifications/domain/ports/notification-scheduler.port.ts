export const NOTIFICATION_SCHEDULER = Symbol('NOTIFICATION_SCHEDULER');

/**
 * Programación diferida del envío de correos de una notificación. La
 * implementación (BullMQ) encola un job con retraso hasta `sendAt` y devuelve el
 * jobId, que se persiste para poder cancelarlo luego.
 */
export interface NotificationSchedulerPort {
    scheduleInternal(input: {
        notificationId: number;
        sendAt: Date;
    }): Promise<string>;
    scheduleExternal(input: {
        notificationId: number;
        sendAt: Date;
    }): Promise<string>;
    cancel(jobId: string): Promise<void>;
}
