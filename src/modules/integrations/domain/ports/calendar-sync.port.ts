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

export interface CalendarSyncResult {
    outlookEventId: string;
    /** URL de Teams si el evento se creó como reunión online; null si no. */
    teamsJoinUrl: string | null;
}

export interface CalendarSyncPort {
    /** Indica si el usuario tiene Microsoft conectado (RN-001). */
    isUserConnected(userId: number): Promise<boolean>;

    /**
     * Crea un evento en Outlook. Si options.onlineMeeting = true, el evento se
     * crea como reunión de Teams y el resultado incluye la URL de unión.
     */
    createCalendarEvent(
        userId: number,
        input: CalendarEventInput,
        options?: { onlineMeeting?: boolean },
    ): Promise<CalendarSyncResult>;

    /** Actualiza un evento existente de Outlook. */
    updateCalendarEvent(
        userId: number,
        eventId: string,
        input: CalendarEventInput,
    ): Promise<void>;

    /** Elimina/cancela un evento de Outlook. */
    deleteCalendarEvent(userId: number, eventId: string): Promise<void>;
}

export const CALENDAR_SYNC = Symbol('CALENDAR_SYNC');
