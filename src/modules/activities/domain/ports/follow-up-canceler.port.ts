export const FOLLOW_UP_CANCELER = Symbol('FOLLOW_UP_CANCELER');

/**
 * Puerto saliente: al completar una actividad, se notifica para cancelar el
 * correo de seguimiento externo pendiente (CU007). Lo implementa el módulo de
 * notificaciones; activities solo declara la dependencia.
 */
export interface FollowUpCancelerPort {
    onActivityCompleted(idActividad: number): Promise<void>;
}
