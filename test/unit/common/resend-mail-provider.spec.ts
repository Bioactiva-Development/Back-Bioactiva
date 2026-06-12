import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockEmailsSend = jest.fn();
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: { send: mockEmailsSend },
    })),
}));

jest.mock('node:fs', () => ({
    readFileSync: jest
        .fn()
        .mockReturnValue(
            '<html>{{recipientEmail}} - {{roleLabel}} - {{invitationLink}}</html>',
        ),
}));

const mockJoin = jest.fn().mockReturnValue('/fake/path/template.html');
jest.mock('node:path', () => ({
    join: (...args: any[]) => mockJoin(...args),
}));

describe('ResendMailProvider', () => {
    const originalResendToken = process.env.RESEND_TOKEN;
    const originalFrontendUrl = process.env.FRONTEND_URL;
    const originalMailFrom = process.env.MAIL_FROM;
    const originalMailFromName = process.env.MAIL_FROM_NAME;

    beforeEach(() => {
        jest.resetModules();
        process.env.RESEND_TOKEN = 're_test_token';
        process.env.FRONTEND_URL = 'https://app.bioactiva.com';
        process.env.MAIL_FROM = 'noreply@bioactiva.com';
        process.env.MAIL_FROM_NAME = 'Bioactiva CRM';
        mockEmailsSend.mockReset();
    });

    afterAll(() => {
        if (originalResendToken) process.env.RESEND_TOKEN = originalResendToken;
        else delete process.env.RESEND_TOKEN;
        if (originalFrontendUrl) process.env.FRONTEND_URL = originalFrontendUrl;
        else delete process.env.FRONTEND_URL;
        if (originalMailFrom) process.env.MAIL_FROM = originalMailFrom;
        else delete process.env.MAIL_FROM;
        if (originalMailFromName)
            process.env.MAIL_FROM_NAME = originalMailFromName;
        else delete process.env.MAIL_FROM_NAME;
    });

    it('should send invitation email via Resend', async () => {
        const {
            ResendMailProvider,
        } = require('@/modules/common/mail/resend.instance');
        const provider = new ResendMailProvider();
        mockEmailsSend.mockResolvedValue({ id: 'email-id' });

        await provider.sendInvitationEmail({
            correo: 'user@example.com',
            token: 'token-abc',
            rol: 1 as any,
            invitedBy: 1,
        });

        expect(mockEmailsSend).toHaveBeenCalledWith(
            expect.objectContaining({
                from: 'Bioactiva CRM <noreply@bioactiva.com>',
                to: 'user@example.com',
                subject: 'Invitación a Back Bioactiva',
            }),
        );
    });

    it('should send reset password email via Resend', async () => {
        const {
            ResendMailProvider,
        } = require('@/modules/common/mail/resend.instance');
        const provider = new ResendMailProvider();
        mockEmailsSend.mockResolvedValue({ id: 'email-id' });

        await provider.sendResetPasswordEmail({
            correo: 'user@example.com',
            token: 'token-reset',
        });

        expect(mockEmailsSend).toHaveBeenCalledWith(
            expect.objectContaining({
                from: 'Bioactiva CRM <noreply@bioactiva.com>',
                to: 'user@example.com',
                subject: 'Restablecer contraseña - Bioactiva',
            }),
        );
    });

    it('should throw when RESEND_TOKEN is not set', async () => {
        delete process.env.RESEND_TOKEN;

        const {
            ResendMailProvider,
        } = require('@/modules/common/mail/resend.instance');
        const provider = new ResendMailProvider();

        await expect(
            provider.sendInvitationEmail({
                correo: 'user@example.com',
                token: 'token',
                rol: 1 as any,
                invitedBy: 1,
            }),
        ).rejects.toThrow('RESEND_TOKEN is required');
    });
});
