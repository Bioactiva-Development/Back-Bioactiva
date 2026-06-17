import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

/**
 * Días de antelación con los que una actividad pendiente se considera "por
 * vencer" (POR_VENCER). Una actividad ya vencida (fechaFin pasada) también cae
 * en este nivel, por ser el más urgente.
 */
export const ACTIVITY_ALERT_DUE_SOON_DAYS = 4;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Fechas relevantes de una actividad PENDIENTE para calcular el semáforo: su
 * creación y su cierre. CRITICO depende de ambas (mitad del tiempo disponible).
 */
export interface PendingActivityDates {
    createdAt: Date;
    fechaFin: Date;
}

/**
 * ¿La actividad ya superó la mitad de su tiempo disponible? El punto medio es
 * createdAt + (fechaFin - createdAt) / 2; es crítica cuando ahora lo alcanzó o
 * pasó.
 */
function hasPassedMidpoint(activity: PendingActivityDates, now: Date): boolean {
    const midpoint =
        activity.createdAt.getTime() +
        (activity.fechaFin.getTime() - activity.createdAt.getTime()) / 2;
    return now.getTime() >= midpoint;
}

/**
 * Calcula el nivel del semáforo de un Lead a partir de las fechas de sus
 * actividades PENDIENTES (las realizadas/canceladas/eliminadas no cuentan).
 * Devuelve el nivel más urgente. Función pura: recibe el "ahora" para ser
 * determinista y testeable.
 *
 * Severidad: POR_VENCER > CRITICO > PENDIENTE > LIBRE.
 */
export function computeActivityAlert(
    pendingActivities: PendingActivityDates[],
    now: Date,
    dueSoonDays: number = ACTIVITY_ALERT_DUE_SOON_DAYS,
): ActivityAlertLevel {
    if (pendingActivities.length === 0) {
        return ActivityAlertLevel.LIBRE;
    }

    const dueSoonCutoff = now.getTime() + dueSoonDays * MS_PER_DAY;

    let level = ActivityAlertLevel.PENDIENTE;

    for (const activity of pendingActivities) {
        // POR_VENCER (incluye vencidas: fechaFin <= ahora + umbral) es el nivel
        // más urgente, así que en cuanto aparece se puede devolver.
        if (activity.fechaFin.getTime() <= dueSoonCutoff) {
            return ActivityAlertLevel.POR_VENCER;
        }
        if (hasPassedMidpoint(activity, now)) {
            level = ActivityAlertLevel.CRITICO;
        }
    }

    return level;
}
