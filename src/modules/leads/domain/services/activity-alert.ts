import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

/**
 * Días de antelación con los que una actividad pendiente se considera "próxima a
 * vencer" (amarillo). Una actividad cuya fechaFin ya pasó es "vencida" (rojo).
 */
export const ACTIVITY_ALERT_YELLOW_DAYS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calcula el nivel de alerta de un Lead a partir de las fechas de fin de sus
 * actividades PENDIENTES (las realizadas/canceladas no cuentan). La función es
 * pura: recibe el "ahora" para ser determinista y testeable.
 *
 * @param pendingDueDates fechaFin de las actividades pendientes del lead.
 */
export function computeActivityAlert(
    pendingDueDates: Date[],
    now: Date,
    yellowThresholdDays: number = ACTIVITY_ALERT_YELLOW_DAYS,
): ActivityAlertLevel {
    if (pendingDueDates.length === 0) {
        return ActivityAlertLevel.VERDE;
    }

    const yellowCutoff = new Date(
        now.getTime() + yellowThresholdDays * MS_PER_DAY,
    );

    let hasOverdue = false;
    let hasUpcoming = false;

    for (const dueDate of pendingDueDates) {
        if (dueDate < now) {
            hasOverdue = true;
        } else if (dueDate <= yellowCutoff) {
            hasUpcoming = true;
        }
    }

    if (hasOverdue) {
        return ActivityAlertLevel.ROJO;
    }
    if (hasUpcoming) {
        return ActivityAlertLevel.AMARILLO;
    }
    return ActivityAlertLevel.VERDE;
}
