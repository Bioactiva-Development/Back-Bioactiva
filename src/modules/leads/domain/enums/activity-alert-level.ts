/**
 * Semáforo de actividades de un Lead. Un único nivel por lead: el más urgente
 * entre sus actividades PENDIENTES. Orden de severidad (de menor a mayor):
 * SIN_ACTIVIDADES < PENDIENTE < POR_VENCER.
 *
 * - SIN_ACTIVIDADES: el lead no tiene actividades pendientes.
 * - PENDIENTE: tiene actividades pendientes, pero ninguna por vencer.
 * - POR_VENCER: alguna actividad pendiente vence dentro de los próximos
 *   ACTIVITY_ALERT_DUE_SOON_DAYS días (o ya está vencida).
 */
export enum ActivityAlertLevel {
    SIN_ACTIVIDADES = 'SIN_ACTIVIDADES',
    PENDIENTE = 'PENDIENTE',
    POR_VENCER = 'POR_VENCER',
}
