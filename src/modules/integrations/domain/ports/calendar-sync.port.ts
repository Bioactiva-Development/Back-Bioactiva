/**
 * Contrato de sincronización CRM -> Microsoft (Outlook Calendar / Teams).
 *
 * Lo consumen otros módulos (p. ej. Activity) sin conocer Microsoft Graph.
 * La resolución del token del usuario y las llamadas a Graph quedan
 * encapsuladas en el adaptador de infraestructura del módulo de integraciones.
 */
export interface CalendarEventInput {
    subject: string;
    start: Date;
    end: Date;
    body?: string | null;
}

export interface CalendarSyncPort {
    /** Indica si el usuario tiene Microsoft conectado (RN-001). */
    isUserConnected(userId: number): Promise<boolean>;

    /** Crea un evento en Outlook y devuelve su id. */
    createCalendarEvent(
        userId: number,
        input: CalendarEventInput,
    ): Promise<string>;

    /** Actualiza un evento existente de Outlook. */
    updateCalendarEvent(
        userId: number,
        eventId: string,
        input: CalendarEventInput,
    ): Promise<void>;

    /** Elimina/cancela un evento de Outlook. */
    deleteCalendarEvent(userId: number, eventId: string): Promise<void>;

    /** Crea una reunión de Teams y devuelve su URL de unión. */
    createTeamsMeeting(
        userId: number,
        input: CalendarEventInput,
    ): Promise<string>;
}

export const CALENDAR_SYNC = Symbol('CALENDAR_SYNC');
