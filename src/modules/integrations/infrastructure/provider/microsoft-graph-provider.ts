import { Injectable } from '@nestjs/common';
import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import {
    TokenResponse,
    MicrosoftProfile,
    MicrosoftProviderPort,
    GraphEventData,
} from '@/modules/integrations/domain/ports/microsoft-provider.port';
import { MicrosoftAuthConfig } from '@/modules/integrations/infrastructure/config/microsoft-auth.config';
import { MicrosoftOAuthFailedException } from '@/modules/integrations/domain/exceptions/microsoft-oauth-failed.exception';
import { MicrosoftGraphRequestException } from '@/modules/integrations/domain/exceptions/microsoft-graph-request.exception';

@Injectable()
export class MicrosoftGraphProvider implements MicrosoftProviderPort {
    private readonly msalClient: ConfidentialClientApplication;

    constructor(private readonly config: MicrosoftAuthConfig) {
        const msalConfig: Configuration = {
            auth: {
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                authority: config.authority,
            },
        };
        this.msalClient = new ConfidentialClientApplication(msalConfig);
    }

    async getAuthUrl(state: string): Promise<string> {
        return await this.msalClient.getAuthCodeUrl({
            redirectUri: this.config.redirectUri,
            scopes: this.config.scopes,
            state,
        });
    }

    async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
        try {
            const response = await this.msalClient.acquireTokenByCode({
                code,
                redirectUri: this.config.redirectUri,
                scopes: this.config.scopes,
            });

            const refreshToken = this.extractRefreshTokenFromCache();

            return {
                accessToken: response.accessToken,
                refreshToken,
                expiresIn: response.expiresOn
                    ? Math.floor(
                          (response.expiresOn.getTime() - Date.now()) / 1000,
                      )
                    : undefined,
            };
        } catch (error) {
            throw new MicrosoftOAuthFailedException(
                `Error al intercambiar código OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    async getProfile(accessToken: string): Promise<MicrosoftProfile> {
        try {
            const response = await fetch(
                'https://graph.microsoft.com/v1.0/me',
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Microsoft Graph responded with ${response.status}`,
                );
            }

            const data = await response.json();
            console.log('Microsoft Graph profile data:', data);

            return {
                email: data.mail ?? data.userPrincipalName,
                oid: data.id,
            };
        } catch (error) {
            throw new MicrosoftOAuthFailedException(
                `Error al obtener perfil de Microsoft: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
        try {
            const response = await this.msalClient.acquireTokenByRefreshToken({
                refreshToken,
                scopes: this.config.scopes,
            });

            if (!response) {
                throw new MicrosoftOAuthFailedException(
                    'No se pudo refrescar el token de acceso',
                );
            }

            const newRefreshToken = this.extractRefreshTokenFromCache();

            return {
                accessToken: response.accessToken,
                refreshToken: newRefreshToken,
                expiresIn: response.expiresOn
                    ? Math.floor(
                          (response.expiresOn.getTime() - Date.now()) / 1000,
                      )
                    : undefined,
            };
        } catch (error) {
            if (error instanceof MicrosoftOAuthFailedException) {
                throw error;
            }
            throw new MicrosoftOAuthFailedException(
                `Error al refrescar token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    async createCalendarEvent(
        accessToken: string,
        event: GraphEventData,
    ): Promise<string> {
        const data = await this.graphRequest(
            accessToken,
            'POST',
            'https://graph.microsoft.com/v1.0/me/events',
            this.toGraphEventBody(event),
        );

        if (!data?.id) {
            throw new MicrosoftGraphRequestException(
                'Microsoft Graph no devolvió el id del evento creado',
            );
        }

        return data.id as string;
    }

    async updateCalendarEvent(
        accessToken: string,
        eventId: string,
        event: GraphEventData,
    ): Promise<void> {
        await this.graphRequest(
            accessToken,
            'PATCH',
            `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
            this.toGraphEventBody(event),
        );
    }

    async deleteCalendarEvent(
        accessToken: string,
        eventId: string,
    ): Promise<void> {
        await this.graphRequest(
            accessToken,
            'DELETE',
            `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
        );
    }

    async createTeamsMeeting(
        accessToken: string,
        meeting: GraphEventData,
    ): Promise<string> {
        const data = await this.graphRequest(
            accessToken,
            'POST',
            'https://graph.microsoft.com/v1.0/me/onlineMeetings',
            {
                subject: meeting.subject,
                startDateTime: meeting.start.toISOString(),
                endDateTime: meeting.end.toISOString(),
            },
        );

        if (!data?.joinWebUrl) {
            throw new MicrosoftGraphRequestException(
                'Microsoft Graph no devolvió la URL de la reunión de Teams',
            );
        }

        return data.joinWebUrl as string;
    }

    private toGraphEventBody(event: GraphEventData): Record<string, unknown> {
        return {
            subject: event.subject,
            body: {
                contentType: 'text',
                content: event.body ?? '',
            },
            start: {
                dateTime: event.start.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: event.end.toISOString(),
                timeZone: 'UTC',
            },
        };
    }

    private async graphRequest(
        accessToken: string,
        method: 'POST' | 'PATCH' | 'DELETE',
        url: string,
        body?: Record<string, unknown>,
    ): Promise<Record<string, unknown> | null> {
        let response: globalThis.Response;
        try {
            response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });
        } catch (error) {
            throw new MicrosoftGraphRequestException(
                `Error de red llamando a Microsoft Graph (${method} ${url}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }

        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            throw new MicrosoftGraphRequestException(
                `Microsoft Graph respondió ${response.status} para ${method} ${url}: ${detail}`,
            );
        }

        if (response.status === 204) {
            return null;
        }

        return (await response.json().catch(() => null)) as Record<
            string,
            unknown
        > | null;
    }

    private extractRefreshTokenFromCache(): string | undefined {
        try {
            const cache = this.msalClient.getTokenCache();
            const cacheData = cache.serialize();
            const parsed = JSON.parse(cacheData);
            const refreshTokens = parsed.RefreshToken;
            if (!refreshTokens) return undefined;
            const key = Object.keys(refreshTokens)[0];
            if (!key) return undefined;
            return refreshTokens[key].secret;
        } catch {
            return undefined;
        }
    }
}
