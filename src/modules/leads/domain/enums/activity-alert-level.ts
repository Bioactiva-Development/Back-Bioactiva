/**
 * Semáforo de actividades de un Lead. Un único nivel por lead: el más urgente
 * entre sus actividades PENDIENTES. Orden de severidad (de menor a mayor):
 * SIN_ACTIVIDADES < PENDIENTE < EN_RIESGO < POR_VENCER.
 *
 * - SIN_ACTIVIDADES: el lead no tiene actividades pendientes.
 * - PENDIENTE: tiene actividades pendientes, pero ninguna en riesgo ni por vencer.
 * - EN_RIESGO: alguna actividad pendiente ya superó la mitad de su tiempo
 *   disponible (desde su creación hasta su fecha de cierre) sin completarse.
 * - POR_VENCER: alguna actividad pendiente vence dentro de los próximos
 *   ACTIVITY_ALERT_DUE_SOON_DAYS días (o ya está vencida).
 */
export enum ActivityAlertLevel {
    SIN_ACTIVIDADES = 'SIN_ACTIVIDADES',
    PENDIENTE = 'PENDIENTE',
    EN_RIESGO = 'EN_RIESGO',
    POR_VENCER = 'POR_VENCER',
}
