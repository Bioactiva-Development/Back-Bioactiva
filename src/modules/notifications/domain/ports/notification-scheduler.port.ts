export const NOTIFICATION_SCHEDULER = Symbol('NOTIFICATION_SCHEDULER');

/**
 * Programación diferida del envío de correos de una notificación. La
 * implementación (BullMQ) encola un job con retraso hasta `sendAt` y devuelve el
 * jobId, que se persiste para poder cancelarlo luego.
 */
export interface NotificationSchedulerPort {
    /** Recordatorio: correo interno al responsable (clave por notificación). */
    scheduleInternal(input: {
        notificationId: number;
        sendAt: Date;
    }): Promise<string>;
    /** Seguimiento: correo interno de una instancia (clave por instancia). */
    scheduleInstanceInternal(input: {
        instanciaId: number;
        sendAt: Date;
    }): Promise<string>;
    /** Seguimiento: correo externo de una instancia (clave por instancia). */
    scheduleInstanceExternal(input: {
        instanciaId: number;
        sendAt: Date;
    }): Promise<string>;
    cancel(jobId: string): Promise<void>;
}
