/**
 * Semáforo de actividades de un Lead. Un único nivel por lead: el más urgente
 * entre sus actividades PENDIENTES. Orden de severidad (de menor a mayor):
 * LIBRE < PENDIENTE < CRITICO < POR_VENCER.
 *
 * - LIBRE: el lead no tiene actividades pendientes.
 * - PENDIENTE: tiene actividades pendientes, pero ninguna crítica ni por vencer.
 * - CRITICO: alguna actividad pendiente ya superó la mitad de su tiempo
 *   disponible (desde su creación hasta su fecha de cierre) sin completarse.
 * - POR_VENCER: alguna actividad pendiente vence dentro de los próximos
 *   ACTIVITY_ALERT_DUE_SOON_DAYS días (o ya está vencida).
 */
export enum ActivityAlertLevel {
    LIBRE = 'LIBRE',
    PENDIENTE = 'PENDIENTE',
    CRITICO = 'CRITICO',
    POR_VENCER = 'POR_VENCER',
}
