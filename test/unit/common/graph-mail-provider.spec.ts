import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockPost = jest.fn();
const mockApi = jest.fn(() => ({ post: mockPost }));
const mockInitWithMiddleware = jest.fn();
const mockAcquireTokenByClientCredential = jest.fn();

jest.mock('@microsoft/microsoft-graph-client', () => ({
    Client: {
        initWithMiddleware: (...args: unknown[]) =>
            mockInitWithMiddleware(...args),
    },
}));

jest.mock('@azure/msal-node', () => ({
    ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
        acquireTokenByClientCredential: mockAcquireTokenByClientCredential,
    })),
}));

import { GraphMailProvider } from '@/modules/common/mail/graph-mail.provider';
import { UserRole } from '@/shared/domain/enums/rol';

/**
 * GraphMailProvider
 * -----------------
 * Envía correos a través de Microsoft Graph usando client credentials de MSAL.
 * Cubre el envío de invitación, reset y genérico, y el authProvider que resuelve
 * el access token (presente y ausente).
 */
describe('Common module', () => {
    describe('GraphMailProvider', () => {
        let provider: GraphMailProvider;
        let capturedAuthProvider: {
            getAccessToken: () => Promise<string>;
        };

        beforeEach(() => {
            mockPost.mockReset().mockResolvedValue(undefined);
            mockApi.mockClear();
            mockAcquireTokenByClientCredential.mockReset();
            process.env.MAIL_FROM = 'noreply@bioactiva.com';

            mockInitWithMiddleware.mockImplementation((opts: any) => {
                capturedAuthProvider = opts.authProvider;
                return { api: mockApi };
            });

            provider = new GraphMailProvider();
        });

        it('sends an invitation email through Graph', async () => {
            await provider.sendInvitationEmail({
                correo: 'user@example.com',
                token: 'tok',
                rol: UserRole.TRABAJADOR,
                invitedBy: 1,
            });

            expect(mockApi).toHaveBeenCalledWith(
                '/users/noreply@bioactiva.com/sendMail',
            );
            const payload = mockPost.mock.calls[0][0] as any;
            expect(payload.message.subject).toBe('Invitación a Back Bioactiva');
            expect(payload.message.toRecipients[0].emailAddress.address).toBe(
                'user@example.com',
            );
        });

        it('sends a reset password email through Graph', async () => {
            await provider.sendResetPasswordEmail({
                correo: 'user@example.com',
                token: 'reset',
            });

            const payload = mockPost.mock.calls[0][0] as any;
            expect(payload.message.subject).toBe(
                'Restablecer contraseña - Bioactiva',
            );
        });

        it('sends a generic email through Graph', async () => {
            await provider.sendGenericEmail({
                to: 'dest@example.com',
                subject: 'Hola',
                html: '<p>hi</p>',
            });

            const payload = mockPost.mock.calls[0][0] as any;
            expect(payload.message.subject).toBe('Hola');
            expect(payload.message.body.content).toBe('<p>hi</p>');
            expect(payload.message.toRecipients[0].emailAddress.address).toBe(
                'dest@example.com',
            );
        });

        it('authProvider returns the MSAL access token when present', async () => {
            mockAcquireTokenByClientCredential.mockResolvedValue({
                accessToken: 'graph-token',
            });

            await provider.sendGenericEmail({
                to: 'd@e.com',
                subject: 's',
                html: 'h',
            });

            await expect(
                capturedAuthProvider.getAccessToken(),
            ).resolves.toBe('graph-token');
        });

        it('authProvider returns "" when MSAL yields no token', async () => {
            mockAcquireTokenByClientCredential.mockResolvedValue(null);

            await provider.sendGenericEmail({
                to: 'd@e.com',
                subject: 's',
                html: 'h',
            });

            await expect(
                capturedAuthProvider.getAccessToken(),
            ).resolves.toBe('');
        });
    });
});
