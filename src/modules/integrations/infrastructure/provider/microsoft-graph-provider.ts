import { Injectable } from '@nestjs/common';
import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import {
    TokenResponse,
    MicrosoftProfile,
    MicrosoftProviderPort,
} from '@/modules/integrations/domain/ports/microsoft-provider.port';
import { MicrosoftAuthConfig } from '@/modules/integrations/infrastructure/config/microsoft-auth.config';
import { MicrosoftOAuthFailedException } from '@/modules/integrations/domain/exceptions/microsoft-oauth-failed.exception';

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
