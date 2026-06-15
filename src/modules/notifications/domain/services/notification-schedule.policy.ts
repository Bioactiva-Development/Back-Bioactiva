import { InvalidScheduleDateException } from '@/modules/notifications/domain/exceptions/invalid-schedule-date.exception';

export const BUSINESS_HOUR_START = 9;
export const BUSINESS_HOUR_END = 18;

/**
 * El recordatorio se programa como un contador de minutos ANTES de que finalice
 * la actividad (`fechaFin`). El tope es 2 horas antes; el mínimo, 1 minuto.
 */
export const MAX_REMINDER_MINUTES = 120;
export const MIN_REMINDER_MINUTES = 1;

/**
 * Calcula el instante de envío del recordatorio: `fechaFin - minutosAntes`.
 * Valida que `minutosAntes` esté en [1, 120] y que el resultado sea futuro
 * (la actividad no debe finalizar tan pronto que el recordatorio caiga en el
 * pasado).
 */
export function computeReminderSendAt(
    fechaFinActividad: Date,
    minutosAntes: number,
    now: Date,
): Date {
    if (
        !Number.isInteger(minutosAntes) ||
        minutosAntes < MIN_REMINDER_MINUTES ||
        minutosAntes > MAX_REMINDER_MINUTES
    ) {
        throw new InvalidScheduleDateException(
            `El recordatorio debe programarse entre ${MIN_REMINDER_MINUTES} y ${MAX_REMINDER_MINUTES} minutos antes del fin de la actividad.`,
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
