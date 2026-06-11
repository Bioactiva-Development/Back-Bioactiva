/**
 * Filtro de listado por el semáforo de actividades del lead:
 * - TODAS: leads con alerta amarilla o roja (pendientes por vencer o vencidas).
 * - POR_VENCER: solo leads con alerta amarilla (pendientes próximas a vencer,
 *   sin ninguna vencida).
 * - VENCIDAS: solo leads con alerta roja (al menos una pendiente ya vencida).
 */
export enum ActivityAlertFilter {
    TODAS = 'TODAS',
    POR_VENCER = 'POR_VENCER',
    VENCIDAS = 'VENCIDAS',
}
