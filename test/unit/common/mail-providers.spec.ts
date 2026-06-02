import { describe, expect, it, jest } from '@jest/globals';
import { MockMailProvider } from '@/modules/common/mail/mock-mail.provider';
import { SmtpMailProvider } from '@/modules/common/mail/smtp-mail.provider';
import { UserRole } from '@/shared/domain/enums/rol';

describe('Mail Providers', () => {
    const originalFrontendUrl = process.env.FRONTEND_URL;

    beforeAll(() => {
        process.env.FRONTEND_URL = 'https://app.bioactiva.com';
    });

    afterAll(() => {
        if (originalFrontendUrl) {
            process.env.FRONTEND_URL = originalFrontendUrl;
        } else {
            delete process.env.FRONTEND_URL;
        }
    });

    describe('MockMailProvider', () => {
        it('should send invitation email without error', async () => {
            const provider = new MockMailProvider();
            await expect(
                provider.sendInvitationEmail({
                    correo: 'user@example.com',
                    token: 'token-abc',
                    rol: UserRole.TRABAJADOR,
                    invitedBy: 1,
                }),
            ).resolves.toBeUndefined();
        });

        it('should send reset password email without error', async () => {
            const provider = new MockMailProvider();
            await expect(
                provider.sendResetPasswordEmail({
                    correo: 'user@example.com',
                    token: 'token-reset',
                }),
            ).resolves.toBeUndefined();
        });
    });

    describe('SmtpMailProvider', () => {
        it('should throw when RESEND_TOKEN is not set', async () => {
            const originalToken = process.env.RESEND_TOKEN;
            delete process.env.RESEND_TOKEN;

            const provider = new SmtpMailProvider();
            await expect(
                provider.sendInvitationEmail({
                    correo: 'user@example.com',
                    token: 'token-abc',
                    rol: UserRole.TRABAJADOR,
                    invitedBy: 1,
                }),
            ).rejects.toThrow('RESEND_TOKEN is required');

            if (originalToken) {
                process.env.RESEND_TOKEN = originalToken;
            }
        });
    });
});
