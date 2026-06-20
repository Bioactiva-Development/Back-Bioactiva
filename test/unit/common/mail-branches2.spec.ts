import { describe, expect, it, jest, beforeEach, afterAll } from '@jest/globals';

const mockEmailsSend = jest.fn();
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: { send: mockEmailsSend },
    })),
}));

const mockFsReadFileSync = jest.fn();
jest.mock('node:fs', () => ({
    readFileSync: (...args: any[]) => mockFsReadFileSync(...args),
}));

const mockJoin = jest.fn();
jest.mock('node:path', () => ({
    join: (...args: any[]) => mockJoin(...args),
}));

/**
 * Branch coverage extra:
 * - reset-password renderer: la segunda invocación toma el camino cacheado
 *   (`if (cachedTemplate)`).
 * - resend.instance: reutiliza la instancia cacheada (`if (instance)`) y lanza
 *   cuando la API devuelve `{ error }` (`if (error)`).
 */
describe('Common mail — branches2', () => {
    const originalFrontendUrl = process.env.FRONTEND_URL;
    const originalResendToken = process.env.RESEND_TOKEN;
    const originalMailFrom = process.env.MAIL_FROM;
    const originalMailFromName = process.env.MAIL_FROM_NAME;

    beforeEach(() => {
        jest.resetModules();
        process.env.FRONTEND_URL = 'https://app.bioactiva.com';
        process.env.RESEND_TOKEN = 're_test_token';
        process.env.MAIL_FROM = 'noreply@bioactiva.com';
        process.env.MAIL_FROM_NAME = 'Bioactiva CRM';
        mockEmailsSend.mockReset();
        mockFsReadFileSync.mockReset();
        mockJoin.mockReset();
    });

    afterAll(() => {
        if (originalFrontendUrl) process.env.FRONTEND_URL = originalFrontendUrl;
        else delete process.env.FRONTEND_URL;
        if (originalResendToken) process.env.RESEND_TOKEN = originalResendToken;
        else delete process.env.RESEND_TOKEN;
        if (originalMailFrom) process.env.MAIL_FROM = originalMailFrom;
        else delete process.env.MAIL_FROM;
        if (originalMailFromName)
            process.env.MAIL_FROM_NAME = originalMailFromName;
        else delete process.env.MAIL_FROM_NAME;
    });

    it('reset password renderer caches the template after the first render', () => {
        mockJoin.mockReturnValue('/fake/path/reset-password.html');
        mockFsReadFileSync.mockReturnValue(
            '<html>{{recipientEmail}} - {{resetLink}}</html>',
        );

        const {
            renderResetPasswordEmailTemplate,
        } = require('@/modules/common/mail/reset-password-email.renderer');

        const first = renderResetPasswordEmailTemplate({
            correo: 'user@example.com',
            token: 'tok-1',
        });
        const second = renderResetPasswordEmailTemplate({
            correo: 'otro@example.com',
            token: 'tok-2',
        });

        expect(first).toContain('user@example.com');
        expect(second).toContain('otro@example.com');
        // La plantilla se lee del disco solo una vez (segunda llamada cacheada).
        expect(mockFsReadFileSync).toHaveBeenCalledTimes(1);
    });

    it('resend reuses the cached instance across dispatches', async () => {
        const { Resend } = require('resend');
        mockEmailsSend.mockResolvedValue({ error: null });

        const {
            ResendMailProvider,
        } = require('@/modules/common/mail/resend.instance');
        const provider = new ResendMailProvider();

        await provider.sendGenericEmail({
            to: 'a@example.com',
            subject: 'S1',
            html: '<p>1</p>',
        });
        await provider.sendGenericEmail({
            to: 'b@example.com',
            subject: 'S2',
            html: '<p>2</p>',
        });

        // Una única construcción del cliente Resend (instancia cacheada).
        expect(Resend).toHaveBeenCalledTimes(1);
        expect(mockEmailsSend).toHaveBeenCalledTimes(2);
    });

    it('resend throws when the API returns an error', async () => {
        mockEmailsSend.mockResolvedValue({
            error: { message: 'dominio no verificado' },
        });

        const {
            ResendMailProvider,
        } = require('@/modules/common/mail/resend.instance');
        const provider = new ResendMailProvider();

        await expect(
            provider.sendGenericEmail({
                to: 'fail@example.com',
                subject: 'S',
                html: '<p>x</p>',
            }),
        ).rejects.toThrow('Resend rechazó el envío a fail@example.com');
    });
});
