import { Injectable } from '@nestjs/common';
import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import {
    TokenResponse,
    MicrosoftProfile,
    MicrosoftProviderPort,
    GraphEventData,
    GraphCalendarEventResult,
} from '@/modules/integrations/domain/ports/microsoft-provider.port';
import { MicrosoftAuthConfig } from '@/modules/integrations/infrastructure/config/microsoft-auth.config';
import { MicrosoftOAuthFailedException } from '@/modules/integrations/domain/exceptions/microsoft-oauth-failed.exception';
import { MicrosoftRefreshTokenInvalidException } from '@/modules/integrations/domain/exceptions/microsoft-refresh-token-invalid.exception';
import { MicrosoftGraphRequestException } from '@/modules/integrations/domain/exceptions/microsoft-graph-request.exception';
import { toLocalISOString } from '@/shared/infrastructure/datetime/range-in-zone';

@Injectable()
export class MicrosoftGraphProvider implements MicrosoftProviderPort {
    constructor(private readonly config: MicrosoftAuthConfig) {}

    /**
     * Crea un cliente MSAL con cache en memoria propio para CADA operación de
     * tokens. Antes el cliente era un singleton: su cache acumulaba los refresh
     * tokens de todos los usuarios y `extractRefreshTokenFromCache` tomaba el
     * primero (`Object.keys()[0]`), por lo que la rotación podía persistir el
     * token de otra cuenta (fuga cross-usuario). Con un cliente efímero el cache
     * solo contiene el token de la llamada en curso.
     */
    private buildClient(): ConfidentialClientApplication {
        const msalConfig: Configuration = {
            auth: {
                clientId: this.config.clientId,
                clientSecret: this.config.clientSecret,
                authority: this.config.authority,
            },
        };
        return new ConfidentialClientApplication(msalConfig);
    }

    async getAuthUrl(state: string): Promise<string> {
        return await this.buildClient().getAuthCodeUrl({
            redirectUri: this.config.redirectUri,
            scopes: this.config.scopes,
            state,
        });
    }

    async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
        const client = this.buildClient();
        try {
            const response = await client.acquireTokenByCode({
                code,
                redirectUri: this.config.redirectUri,
                scopes: this.config.scopes,
            });

            const refreshToken = this.extractRefreshTokenFromCache(client);

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
        const client = this.buildClient();
        try {
            const response = await client.acquireTokenByRefreshToken({
                refreshToken,
                scopes: this.config.scopes,
            });

            if (!response) {
                throw new MicrosoftOAuthFailedException(
                    'No se pudo refrescar el token de acceso',
                );
            }

            const newRefreshToken = this.extractRefreshTokenFromCache(client);

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
            // invalid_grant (o las variantes AADSTS de expiración/revocación) son
            // terminales: el refresh token murió y hay que reconectar la cuenta.
            // Se distingue de un fallo transitorio (red, 5xx) para que el caller
            // marque la integración como desconectada solo en este caso.
            if (this.isInvalidRefreshTokenError(error)) {
                throw new MicrosoftRefreshTokenInvalidException(
                    'El refresh token de Microsoft expiró o fue revocado; se requiere reconectar la cuenta',
                );
            }
            throw new MicrosoftOAuthFailedException(
                `Error al refrescar token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Indica si el error de MSAL corresponde a un refresh token caducado/revocado.
     * Microsoft lo señala con `errorCode === 'invalid_grant'` y/o un código AADSTS:
     *  - AADSTS700082: refresh token expirado por inactividad.
     *  - AADSTS70008:  token expirado o revocado.
     *  - AADSTS50173:  credenciales cambiadas (p. ej. cambio de contraseña).
     *  - AADSTS700084: refresh token fuera de su ventana de validez.
     */
    private isInvalidRefreshTokenError(error: unknown): boolean {
        const e = error as {
            errorCode?: string;
            errorMessage?: string;
            message?: string;
        };
        if (e?.errorCode === 'invalid_grant') {
            return true;
        }
        const detail = `${e?.errorMessage ?? ''} ${e?.message ?? ''}`;
        return /AADSTS(700082|70008|50173|700084)/.test(detail);
    }

    async createCalendarEvent(
        accessToken: string,
        event: GraphEventData,
        options?: { onlineMeeting?: boolean },
    ): Promise<GraphCalendarEventResult> {
        const data = await this.graphRequest(
            accessToken,
            'POST',
            'https://graph.microsoft.com/v1.0/me/events',
            this.toGraphEventBody(event, options?.onlineMeeting ?? false),
        );

        if (!data?.id) {
            throw new MicrosoftGraphRequestException(
                'Microsoft Graph no devolvió el id del evento creado',
            );
        }

        const onlineMeeting = data.onlineMeeting as
            | { joinUrl?: string }
            | undefined;

        return {
            id: data.id as string,
            joinUrl: onlineMeeting?.joinUrl ?? null,
        };
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
            this.toGraphEventBody(event, false),
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

    private toGraphEventBody(
        event: GraphEventData,
        onlineMeeting: boolean,
    ): Record<string, unknown> {
        const tz = event.timeZone ?? 'UTC';
        const format = (d: Date) =>
            tz === 'UTC' ? d.toISOString() : toLocalISOString(d, tz);
        return {
            subject: event.subject,
            body: {
                contentType: 'text',
                content: event.body ?? '',
            },
            start: {
                dateTime: format(event.start),
                timeZone: tz,
            },
            end: {
                dateTime: format(event.end),
                timeZone: tz,
            },
            ...(onlineMeeting
                ? {
                      isOnlineMeeting: true,
                      onlineMeetingProvider: 'teamsForBusiness',
                  }
                : {}),
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

    private extractRefreshTokenFromCache(
        client: ConfidentialClientApplication,
    ): string | undefined {
        try {
            const cache = client.getTokenCache();
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
