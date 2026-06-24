export interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
}

export interface MicrosoftProfile {
    email: string;
    oid: string;
}

export interface GraphEventData {
    subject: string;
    start: Date;
    end: Date;
    body?: string | null;
    /** Zona IANA en la que se interpretan `start` y `end`. Por defecto 'UTC'. */
    timeZone?: string;
}

export interface GraphCalendarEventResult {
    id: string;
    /** URL de la reunión de Teams si el evento se creó como online meeting. */
    joinUrl: string | null;
}

export interface MicrosoftProviderPort {
    getAuthUrl(state: string): Promise<string>;
    exchangeCodeForTokens(code: string): Promise<TokenResponse>;
    getProfile(accessToken: string): Promise<MicrosoftProfile>;
    refreshAccessToken(refreshToken: string): Promise<TokenResponse>;

    // Outlook Calendar (sincronización CRM -> Outlook).
    // Si options.onlineMeeting = true, el evento se crea como reunión de Teams
    // (isOnlineMeeting) y el resultado incluye la joinUrl. Esto evita el endpoint
    // /me/onlineMeetings, que requiere cuentas work/school y políticas extra.
    createCalendarEvent(
        accessToken: string,
        event: GraphEventData,
        options?: { onlineMeeting?: boolean },
    ): Promise<GraphCalendarEventResult>;
    updateCalendarEvent(
        accessToken: string,
        eventId: string,
        event: GraphEventData,
    ): Promise<void>;
    deleteCalendarEvent(accessToken: string, eventId: string): Promise<void>;
}

export const MICROSOFT_PROVIDER = Symbol('MICROSOFT_PROVIDER');
