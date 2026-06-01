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
}

export interface MicrosoftProviderPort {
    getAuthUrl(state: string): Promise<string>;
    exchangeCodeForTokens(code: string): Promise<TokenResponse>;
    getProfile(accessToken: string): Promise<MicrosoftProfile>;
    refreshAccessToken(refreshToken: string): Promise<TokenResponse>;

    // Outlook Calendar (sincronización CRM -> Outlook)
    createCalendarEvent(
        accessToken: string,
        event: GraphEventData,
    ): Promise<string>;
    updateCalendarEvent(
        accessToken: string,
        eventId: string,
        event: GraphEventData,
    ): Promise<void>;
    deleteCalendarEvent(accessToken: string, eventId: string): Promise<void>;

    // Microsoft Teams
    createTeamsMeeting(
        accessToken: string,
        meeting: GraphEventData,
    ): Promise<string>;
}

export const MICROSOFT_PROVIDER = Symbol('MICROSOFT_PROVIDER');
