export const ACTIVITY_CONTEXT_READER = Symbol('ACTIVITY_CONTEXT_READER');

export interface ActivityContext {
    idActividad: number;
    idLead: number;
    idResponsable: number;
    responsableEmail: string;
    fechaFin: Date;
    estado: string;
    /** Correos del contacto asociado al lead (principal y secundario). */
    contactEmails: string[];
}

/**
 * Lectura del contexto de una actividad necesaria para programar notificaciones
 * (responsable, lead, fecha fin, correos del contacto) sin acoplar el módulo de
 * notificaciones a los repositorios de actividades/leads/usuarios.
 */
export interface ActivityContextReaderPort {
    /**
     * Actividad activa (única por regla de negocio) del lead. La notificación se
     * asocia siempre a esta actividad; el formulario solo la muestra de forma
     * informativa. Devuelve null si el lead no tiene una actividad activa.
     */
    getActiveActivityByLead(idLead: number): Promise<ActivityContext | null>;
    getUserEmail(idUsuario: number): Promise<string | null>;
}
