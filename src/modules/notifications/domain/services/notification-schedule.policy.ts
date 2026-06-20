import { InvalidScheduleDateException } from '@/modules/notifications/domain/exceptions/invalid-schedule-date.exception';

/**
 * El recordatorio se programa como un contador de minutos ANTES de que finalice
 * la actividad (`fechaFin`). El mínimo es 1 minuto; no hay tope máximo, salvo el
 * implícito de que el envío resultante no caiga en el pasado.
 */
export const MIN_REMINDER_MINUTES = 1;

/**
 * Calcula el instante de envío del recordatorio: `fechaFin - minutosAntes`.
 * Valida que `minutosAntes` sea un entero >= 1 y que el resultado sea futuro
 * (la actividad no debe finalizar tan pronto que el recordatorio caiga en el
 * pasado).
 */
export function computeReminderSendAt(
    fechaFinActividad: Date,
    minutosAntes: number,
    now: Date,
): Date {
    if (!Number.isInteger(minutosAntes) || minutosAntes < MIN_REMINDER_MINUTES) {
        throw new InvalidScheduleDateException(
            `El recordatorio debe programarse al menos ${MIN_REMINDER_MINUTES} minuto antes del fin de la actividad.`,
        );
    }
    const sendAt = new Date(
        fechaFinActividad.getTime() - minutosAntes * 60_000,
    );
    if (sendAt <= now) {
        throw new InvalidScheduleDateException(
            'La actividad finaliza demasiado pronto para programar el recordatorio con esa antelación.',
        );
    }
    return sendAt;
}

export function assertInternalDate(
    fechaEnvio: Date,
    fechaFinActividad: Date,
    now: Date,
): void {
    if (fechaEnvio <= now) {
        throw new InvalidScheduleDateException(
            'El recordatorio debe programarse después de la fecha actual.',
        );
    }
    if (fechaEnvio >= fechaFinActividad) {
        throw new InvalidScheduleDateException(
            'El recordatorio debe programarse antes de la fecha de fin de la actividad.',
        );
    }
}

export function assertExternalDate(
    fechaEnvio: Date,
    fechaFinActividad: Date,
    now: Date,
): void {
    if (fechaEnvio <= now) {
        throw new InvalidScheduleDateException(
            'El correo al cliente debe programarse después de la fecha actual.',
        );
    }
    if (fechaEnvio >= fechaFinActividad) {
        throw new InvalidScheduleDateException(
            'El correo al cliente debe programarse antes de la fecha de fin de la actividad.',
        );
    }
}

export function assertExternalAfterInternal(
    internal: Date,
    external: Date,
): void {
    if (external <= internal) {
        throw new InvalidScheduleDateException(
            'El correo al cliente debe programarse después del recordatorio interno.',
        );
    }
}

export const MIN_FOLLOW_UP_INSTANCES = 1;
export const MAX_FOLLOW_UP_INSTANCES = 1;

/** Un seguimiento debe tener exactamente una instancia. */
export function assertInstanceCount(count: number): void {
    if (count < MIN_FOLLOW_UP_INSTANCES || count > MAX_FOLLOW_UP_INSTANCES) {
        throw new InvalidScheduleDateException(
            'Un seguimiento debe tener exactamente una instancia.',
        );
    }
}

/**
 * Las instancias se ejecutan en orden y sus fechas no se solapan: el correo
 * interno de una instancia debe programarse después del correo externo de la
 * instancia anterior.
 */
export function assertInstancesChained(
    previousExternal: Date,
    currentInternal: Date,
): void {
    if (currentInternal <= previousExternal) {
        throw new InvalidScheduleDateException(
            'Cada instancia de seguimiento debe programarse después de que finalice la anterior.',
        );
    }
}
