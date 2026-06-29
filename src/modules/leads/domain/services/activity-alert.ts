import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

/**
 * Días de antelación con los que una actividad pendiente se considera "por
 * vencer" (POR_VENCER). Una actividad ya vencida (fechaFin pasada) también cae
 * en este nivel, por ser el más urgente.
 */
export const ACTIVITY_ALERT_DUE_SOON_DAYS = 2;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Fechas relevantes de una actividad PENDIENTE para calcular el semáforo.
 */
export interface PendingActivityDates {
    fechaFin: Date;
}

/**
 * Calcula el nivel del semáforo de un Lead a partir de las fechas de sus
 * actividades PENDIENTES (las realizadas/canceladas/eliminadas no cuentan).
 * Devuelve el nivel más urgente. Función pura: recibe el "ahora" para ser
 * determinista y testeable.
 *
 * Severidad: POR_VENCER > PENDIENTE > SIN_ACTIVIDADES.
 */
export function computeActivityAlert(
    pendingActivities: PendingActivityDates[],
    now: Date,
    dueSoonDays: number = ACTIVITY_ALERT_DUE_SOON_DAYS,
): ActivityAlertLevel {
    if (pendingActivities.length === 0) {
        return ActivityAlertLevel.SIN_ACTIVIDADES;
    }

    const dueSoonCutoff = now.getTime() + dueSoonDays * MS_PER_DAY;

    for (const activity of pendingActivities) {
        if (activity.fechaFin.getTime() <= dueSoonCutoff) {
            return ActivityAlertLevel.POR_VENCER;
        }
    }

    return ActivityAlertLevel.PENDIENTE;
}
