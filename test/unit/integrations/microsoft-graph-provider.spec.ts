import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockGetAuthCodeUrl = jest.fn();
const mockAcquireTokenByCode = jest.fn();
const mockAcquireTokenByRefreshToken = jest.fn();
const mockGetTokenCache = jest.fn();

jest.mock('@azure/msal-node', () => ({
    ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
        getAuthCodeUrl: mockGetAuthCodeUrl,
        acquireTokenByCode: mockAcquireTokenByCode,
        acquireTokenByRefreshToken: mockAcquireTokenByRefreshToken,
        getTokenCache: mockGetTokenCache,
    })),
}));

import { MicrosoftGraphProvider } from '@/modules/integrations/infrastructure/provider/microsoft-graph-provider';
import { MicrosoftAuthConfig } from '@/modules/integrations/infrastructure/config/microsoft-auth.config';
import { MicrosoftOAuthFailedException } from '@/modules/integrations/domain/exceptions/microsoft-oauth-failed.exception';
import { MicrosoftRefreshTokenInvalidException } from '@/modules/integrations/domain/exceptions/microsoft-refresh-token-invalid.exception';
import { MicrosoftGraphRequestException } from '@/modules/integrations/domain/exceptions/microsoft-graph-request.exception';

/**
 * MicrosoftGraphProvider
 * ----------------------
 * Implementa MicrosoftProviderPort sobre MSAL + Microsoft Graph (vía fetch).
 * Cubre cada operación, la extracción del refresh token del cache, y las ramas
 * de error (OAuth, red, status no-ok, 204, json fallido).
 */
describe('Integrations module', () => {
    describe('MicrosoftGraphProvider', () => {
        let provider: MicrosoftGraphProvider;
        const config = {
            clientId: 'client-id',
            clientSecret: 'secret',
            authority: 'https://login.microsoftonline.com/tenant',
            redirectUri: 'https://app/callback',
            scopes: ['openid', 'profile'],
        } as unknown as MicrosoftAuthConfig;

        const cacheWith = (data: unknown) => ({
            serialize: () => JSON.stringify(data),
        });

        const event = {
            subject: 'Reunión',
            start: new Date('2026-06-01T10:00:00.000Z'),
            end: new Date('2026-06-01T11:00:00.000Z'),
            body: 'notas',
        };

        beforeEach(() => {
            mockGetAuthCodeUrl.mockReset();
            mockAcquireTokenByCode.mockReset();
            mockAcquireTokenByRefreshToken.mockReset();
            mockGetTokenCache.mockReset();
            mockGetTokenCache.mockReturnValue(
                cacheWith({
                    RefreshToken: { 'key-1': { secret: 'rt-from-cache' } },
                }),
            );
            provider = new MicrosoftGraphProvider(config);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        describe('getAuthUrl', () => {
            it('delegates to MSAL getAuthCodeUrl', async () => {
                mockGetAuthCodeUrl.mockResolvedValue('https://auth/url');
                await expect(provider.getAuthUrl('state-1')).resolves.toBe(
                    'https://auth/url',
                );
                expect(mockGetAuthCodeUrl).toHaveBeenCalledWith({
                    redirectUri: config.redirectUri,
                    scopes: config.scopes,
                    state: 'state-1',
                });
            });
        });

        describe('exchangeCodeForTokens', () => {
            it('returns tokens with computed expiresIn', async () => {
                const expiresOn = new Date(Date.now() + 3600 * 1000);
                mockAcquireTokenByCode.mockResolvedValue({
                    accessToken: 'access-1',
                    expiresOn,
                });

                const result = await provider.exchangeCodeForTokens('code-1');

                expect(result.accessToken).toBe('access-1');
                expect(result.refreshToken).toBe('rt-from-cache');
                expect(result.expiresIn).toBeGreaterThan(0);
            });

            it('returns undefined expiresIn when expiresOn is absent', async () => {
                mockAcquireTokenByCode.mockResolvedValue({
                    accessToken: 'access-1',
                    expiresOn: null,
                });

                const result = await provider.exchangeCodeForTokens('code-1');

                expect(result.expiresIn).toBeUndefined();
            });

            it('wraps MSAL errors as MicrosoftOAuthFailedException', async () => {
                mockAcquireTokenByCode.mockRejectedValue(new Error('boom'));

                await expect(
                    provider.exchangeCodeForTokens('code-1'),
                ).rejects.toThrow(MicrosoftOAuthFailedException);
            });

            it('handles non-Error throwables', async () => {
                mockAcquireTokenByCode.mockRejectedValue('weird');

                await expect(
                    provider.exchangeCodeForTokens('code-1'),
                ).rejects.toThrow('Unknown error');
            });
        });

        describe('getProfile', () => {
            it('returns the profile using mail when present', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    json: async () => ({
                        mail: 'a@b.com',
                        userPrincipalName: 'upn@b.com',
                        id: 'oid-1',
                    }),
                } as unknown as Response);

                const result = await provider.getProfile('access-1');

                expect(result).toEqual({ email: 'a@b.com', oid: 'oid-1' });
            });

            it('falls back to userPrincipalName when mail is absent', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    json: async () => ({
                        userPrincipalName: 'upn@b.com',
                        id: 'oid-1',
                    }),
                } as unknown as Response);

                const result = await provider.getProfile('access-1');

                expect(result.email).toBe('upn@b.com');
            });

            it('throws MicrosoftOAuthFailedException on non-ok response', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: false,
                    status: 401,
                } as unknown as Response);

                await expect(provider.getProfile('access-1')).rejects.toThrow(
                    MicrosoftOAuthFailedException,
                );
            });

            it('handles non-Error throwables with "Unknown error"', async () => {
                jest.spyOn(global, 'fetch').mockRejectedValue('weird-failure');

                await expect(provider.getProfile('access-1')).rejects.toThrow(
                    'Unknown error',
                );
            });
        });

        describe('refreshAccessToken', () => {
            it('returns refreshed tokens', async () => {
                const expiresOn = new Date(Date.now() + 3600 * 1000);
                mockAcquireTokenByRefreshToken.mockResolvedValue({
                    accessToken: 'access-2',
                    expiresOn,
                });

                const result = await provider.refreshAccessToken('rt-old');

                expect(result.accessToken).toBe('access-2');
                expect(result.refreshToken).toBe('rt-from-cache');
                expect(result.expiresIn).toBeGreaterThan(0);
            });

            it('returns undefined expiresIn when expiresOn is absent', async () => {
                mockAcquireTokenByRefreshToken.mockResolvedValue({
                    accessToken: 'access-2',
                    expiresOn: undefined,
                });

                const result = await provider.refreshAccessToken('rt-old');

                expect(result.expiresIn).toBeUndefined();
            });

            it('throws MicrosoftOAuthFailedException when MSAL returns null', async () => {
                mockAcquireTokenByRefreshToken.mockResolvedValue(null);

                await expect(
                    provider.refreshAccessToken('rt-old'),
                ).rejects.toThrow('No se pudo refrescar');
            });

            it('rethrows an existing MicrosoftOAuthFailedException as-is', async () => {
                const original = new MicrosoftOAuthFailedException('inner');
                mockAcquireTokenByRefreshToken.mockRejectedValue(original);

                await expect(
                    provider.refreshAccessToken('rt-old'),
                ).rejects.toBe(original);
            });

            it('wraps generic errors as MicrosoftOAuthFailedException', async () => {
                mockAcquireTokenByRefreshToken.mockRejectedValue(
                    new Error('network'),
                );

                await expect(
                    provider.refreshAccessToken('rt-old'),
                ).rejects.toThrow('Error al refrescar token');
            });

            it('maps invalid_grant to MicrosoftRefreshTokenInvalidException', async () => {
                mockAcquireTokenByRefreshToken.mockRejectedValue({
                    errorCode: 'invalid_grant',
                    errorMessage: 'AADSTS700082: token expired',
                });

                await expect(
                    provider.refreshAccessToken('rt-old'),
                ).rejects.toBeInstanceOf(MicrosoftRefreshTokenInvalidException);
            });

            it('maps an AADSTS revocation message to MicrosoftRefreshTokenInvalidException', async () => {
                mockAcquireTokenByRefreshToken.mockRejectedValue(
                    new Error('AADSTS50173: credentials changed'),
                );

                await expect(
                    provider.refreshAccessToken('rt-old'),
                ).rejects.toBeInstanceOf(MicrosoftRefreshTokenInvalidException);
            });

            it('handles non-Error throwables with "Unknown error"', async () => {
                mockAcquireTokenByRefreshToken.mockRejectedValue('weird');

                await expect(
                    provider.refreshAccessToken('rt-old'),
                ).rejects.toThrow('Unknown error');
            });
        });

        describe('createCalendarEvent', () => {
            it('creates an event and maps the join URL for online meetings', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    status: 201,
                    json: async () => ({
                        id: 'evt-1',
                        onlineMeeting: { joinUrl: 'https://teams/join' },
                    }),
                } as unknown as Response);

                const result = await provider.createCalendarEvent(
                    'access-1',
                    event,
                    { onlineMeeting: true },
                );

                expect(result).toEqual({
                    id: 'evt-1',
                    joinUrl: 'https://teams/join',
                });
                const body = JSON.parse(
                    (global.fetch as jest.Mock).mock.calls[0][1].body,
                );
                expect(body.isOnlineMeeting).toBe(true);
            });

            it('returns joinUrl null when there is no online meeting', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    status: 201,
                    json: async () => ({ id: 'evt-2' }),
                } as unknown as Response);

                const result = await provider.createCalendarEvent(
                    'access-1',
                    event,
                );

                expect(result).toEqual({ id: 'evt-2', joinUrl: null });
            });

            it('uses an empty body when event.body is null', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    status: 201,
                    json: async () => ({ id: 'evt-3' }),
                } as unknown as Response);

                await provider.createCalendarEvent('access-1', {
                    ...event,
                    body: null,
                });

                const body = JSON.parse(
                    (global.fetch as jest.Mock).mock.calls[0][1].body,
                );
                expect(body.body.content).toBe('');
            });

            it('throws when Graph does not return an id', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    status: 201,
                    json: async () => ({}),
                } as unknown as Response);

                await expect(
                    provider.createCalendarEvent('access-1', event),
                ).rejects.toThrow('no devolvió el id');
            });
        });

        describe('updateCalendarEvent / deleteCalendarEvent', () => {
            it('updates an event (PATCH)', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({}),
                } as unknown as Response);

                await expect(
                    provider.updateCalendarEvent('access-1', 'evt-1', event),
                ).resolves.toBeUndefined();
                expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe(
                    'PATCH',
                );
            });

            it('deletes an event (DELETE, 204 -> null)', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    status: 204,
                } as unknown as Response);

                await expect(
                    provider.deleteCalendarEvent('access-1', 'evt-1'),
                ).resolves.toBeUndefined();
            });
        });

        describe('graphRequest error branches', () => {
            it('throws MicrosoftGraphRequestException on network error', async () => {
                jest.spyOn(global, 'fetch').mockRejectedValue(
                    new Error('ECONNRESET'),
                );

                await expect(
                    provider.deleteCalendarEvent('access-1', 'evt-1'),
                ).rejects.toThrow(MicrosoftGraphRequestException);
            });

            it('handles non-Error network throwables with "Unknown error"', async () => {
                jest.spyOn(global, 'fetch').mockRejectedValue('weird-network');

                await expect(
                    provider.deleteCalendarEvent('access-1', 'evt-1'),
                ).rejects.toThrow('Unknown error');
            });

            it('throws with response detail on non-ok status', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: false,
                    status: 403,
                    text: async () => 'forbidden',
                } as unknown as Response);

                await expect(
                    provider.deleteCalendarEvent('access-1', 'evt-1'),
                ).rejects.toThrow('Microsoft Graph respondió 403');
            });

            it('falls back to empty detail when text() rejects', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: false,
                    status: 500,
                    text: async () => {
                        throw new Error('no body');
                    },
                } as unknown as Response);

                await expect(
                    provider.deleteCalendarEvent('access-1', 'evt-1'),
                ).rejects.toThrow('Microsoft Graph respondió 500');
            });

            it('returns null when json() parsing fails', async () => {
                jest.spyOn(global, 'fetch').mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => {
                        throw new Error('bad json');
                    },
                } as unknown as Response);

                // update no devuelve valor; basta con que no lance.
                await expect(
                    provider.updateCalendarEvent('access-1', 'evt-1', event),
                ).resolves.toBeUndefined();
            });
        });

        describe('extractRefreshTokenFromCache branches', () => {
            it('returns undefined when there is no RefreshToken in cache', async () => {
                mockGetTokenCache.mockReturnValue(cacheWith({}));
                mockAcquireTokenByCode.mockResolvedValue({
                    accessToken: 'a',
                    expiresOn: null,
                });

                const result = await provider.exchangeCodeForTokens('code-1');

                expect(result.refreshToken).toBeUndefined();
            });

            it('returns undefined when RefreshToken has no keys', async () => {
                mockGetTokenCache.mockReturnValue(
                    cacheWith({ RefreshToken: {} }),
                );
                mockAcquireTokenByCode.mockResolvedValue({
                    accessToken: 'a',
                    expiresOn: null,
                });

                const result = await provider.exchangeCodeForTokens('code-1');

                expect(result.refreshToken).toBeUndefined();
            });

            it('returns undefined when cache serialization throws', async () => {
                mockGetTokenCache.mockReturnValue({
                    serialize: () => {
                        throw new Error('cache fail');
                    },
                });
                mockAcquireTokenByCode.mockResolvedValue({
                    accessToken: 'a',
                    expiresOn: null,
                });

                const result = await provider.exchangeCodeForTokens('code-1');

                expect(result.refreshToken).toBeUndefined();
            });
        });
    });
});
