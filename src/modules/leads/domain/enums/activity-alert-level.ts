/**
 * Semáforo de actividades de un Lead (Mantis pendientes #3):
 * - VERDE: al día — sin actividades pendientes próximas a vencer ni vencidas.
 * - AMARILLO: tiene actividades pendientes que vencen dentro del umbral.
 * - ROJO: tiene al menos una actividad pendiente ya vencida.
 */
export enum ActivityAlertLevel {
    VERDE = 'VERDE',
    AMARILLO = 'AMARILLO',
    ROJO = 'ROJO',
}
