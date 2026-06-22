export const FOLLOW_UP_CANCELER = Symbol('FOLLOW_UP_CANCELER');

/**
 * Puerto saliente hacia el módulo de notificaciones. Activities solo declara
 * la dependencia; notifications la implementa a través del adaptador.
 */
export interface FollowUpCancelerPort {
    /** CU007: al completar la actividad se cierra el seguimiento externo pendiente. */
    onActivityCompleted(idActividad: number): Promise<void>;
    /** Al eliminar la actividad se cancelan todos los jobs pendientes (recordatorio y seguimiento). */
    onActivityDeleted(idActividad: number): Promise<void>;
}
