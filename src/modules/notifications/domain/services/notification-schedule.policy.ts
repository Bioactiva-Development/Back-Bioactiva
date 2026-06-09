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
