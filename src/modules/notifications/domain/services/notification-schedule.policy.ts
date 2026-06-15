import { InvalidScheduleDateException } from '@/modules/notifications/domain/exceptions/invalid-schedule-date.exception';

export const BUSINESS_HOUR_START = 9;
export const BUSINESS_HOUR_END = 18;

/**
 * CU007: si el envío cae fuera del horario laboral [09:00, 18:00), se reprograma
 * a las 09:00 del mismo día. Usa la hora local del servidor.
 */
export function ensureBusinessHour(date: Date): Date {
    const hour = date.getHours();
    if (hour >= BUSINESS_HOUR_START && hour < BUSINESS_HOUR_END) {
        return date;
    }
    const adjusted = new Date(date);
    adjusted.setHours(BUSINESS_HOUR_START, 0, 0, 0);
    return adjusted;
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
export const MAX_FOLLOW_UP_INSTANCES = 3;

/** Un seguimiento debe tener entre 1 y 3 instancias. */
export function assertInstanceCount(count: number): void {
    if (count < MIN_FOLLOW_UP_INSTANCES || count > MAX_FOLLOW_UP_INSTANCES) {
        throw new InvalidScheduleDateException(
            `Un seguimiento debe tener entre ${MIN_FOLLOW_UP_INSTANCES} y ${MAX_FOLLOW_UP_INSTANCES} instancias.`,
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
