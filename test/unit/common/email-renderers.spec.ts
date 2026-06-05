import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockTemplate =
    '<html>{{recipientEmail}} - {{roleLabel}} - {{invitationLink}}</html>';
const mockFsReadFileSync = jest.fn();
const mockJoin = jest.fn();

jest.mock('node:fs', () => ({
    readFileSync: (...args: any[]) => mockFsReadFileSync(...args),
}));

jest.mock('node:path', () => ({
    join: (...args: any[]) => mockJoin(...args),
}));

describe('Email Renderers', () => {
    const originalFrontendUrl = process.env.FRONTEND_URL;

    beforeEach(() => {
        jest.resetModules();
        process.env.FRONTEND_URL = 'https://app.bioactiva.com';
        mockJoin.mockReset();
        mockFsReadFileSync.mockReset();
    });

    afterAll(() => {
        if (originalFrontendUrl) {
            process.env.FRONTEND_URL = originalFrontendUrl;
        } else {
            delete process.env.FRONTEND_URL;
        }
    });

    describe('renderInvitationEmailTemplate', () => {
        it('should render template with all placeholders replaced', () => {
            mockJoin.mockReturnValue('/fake/path/invitation.html');
            mockFsReadFileSync.mockReturnValue(mockTemplate);

            const {
                renderInvitationEmailTemplate,
            } = require('@/modules/common/mail/invitation-email.renderer');
            const result = renderInvitationEmailTemplate({
                correo: 'user@example.com',
                token: 'token-abc',
                rol: 1 as any,
                invitedBy: 1,
            });

            expect(result).toContain('user@example.com');
            expect(result).toContain('Trabajador');
            expect(result).toContain(
                'https://app.bioactiva.com/accept-invitation?token=token-abc',
            );
        });

        it('should escape HTML characters in values', () => {
            mockJoin.mockReturnValue('/fake/path/invitation.html');
            mockFsReadFileSync.mockReturnValue(
                '<html>{{recipientEmail}}</html>',
            );

            const {
                renderInvitationEmailTemplate,
            } = require('@/modules/common/mail/invitation-email.renderer');
            const result = renderInvitationEmailTemplate({
                correo: '<script>alert("xss")</script>',
                token: 'token',
                rol: 1 as any,
                invitedBy: 1,
            });

            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;script&gt;');
        });

        it('should throw when template file is not found', () => {
            mockJoin.mockReturnValue('/nonexistent/invitation.html');
            mockFsReadFileSync.mockImplementation(() => {
                throw new Error('ENOENT');
            });

            const {
                renderInvitationEmailTemplate,
            } = require('@/modules/common/mail/invitation-email.renderer');
            expect(() =>
                renderInvitationEmailTemplate({
                    correo: 'test@example.com',
                    token: 'token',
                    rol: 1 as any,
                    invitedBy: 1,
                }),
            ).toThrow('No se pudo cargar la plantilla de invitación');
        });

        it('should use cached template on subsequent calls', () => {
            mockJoin.mockReturnValue('/fake/path/invitation.html');
            mockFsReadFileSync.mockReturnValue(mockTemplate);

            const {
                renderInvitationEmailTemplate,
            } = require('@/modules/common/mail/invitation-email.renderer');
            renderInvitationEmailTemplate({
                correo: 'first@example.com',
                token: 'token1',
                rol: 1 as any,
                invitedBy: 1,
            });
            renderInvitationEmailTemplate({
                correo: 'second@example.com',
                token: 'token2',
                rol: 1 as any,
                invitedBy: 1,
            });

            expect(mockFsReadFileSync).toHaveBeenCalledTimes(1);
        });

        it('should render ADMINISTRADOR role label correctly', () => {
            mockJoin.mockReturnValue('/fake/path/invitation.html');
            mockFsReadFileSync.mockReturnValue('{{roleLabel}}');

            const {
                renderInvitationEmailTemplate,
            } = require('@/modules/common/mail/invitation-email.renderer');
            const result = renderInvitationEmailTemplate({
                correo: 'admin@example.com',
                token: 'token',
                rol: 0 as any,
                invitedBy: 1,
            });

            expect(result).toBe('Administrador');
        });
    });

    describe('renderResetPasswordEmailTemplate', () => {
        it('should render template with all placeholders replaced', () => {
            mockJoin.mockReturnValue('/fake/path/reset-password.html');
            mockFsReadFileSync.mockReturnValue(
                '<html>{{recipientEmail}} - {{resetLink}}</html>',
            );

            const {
                renderResetPasswordEmailTemplate,
            } = require('@/modules/common/mail/reset-password-email.renderer');
            const result = renderResetPasswordEmailTemplate({
                correo: 'user@example.com',
                token: 'token-reset',
            });

            expect(result).toContain('user@example.com');
            expect(result).toContain(
                'https://app.bioactiva.com/reset-password?token=token-reset',
            );
        });

        it('should escape HTML characters in values', () => {
            mockJoin.mockReturnValue('/fake/path/reset-password.html');
            mockFsReadFileSync.mockReturnValue(
                '<html>{{recipientEmail}}</html>',
            );

            const {
                renderResetPasswordEmailTemplate,
            } = require('@/modules/common/mail/reset-password-email.renderer');
            const result = renderResetPasswordEmailTemplate({
                correo: '<img src=x onerror=alert(1)>',
                token: 'token',
            });

            expect(result).toContain('&lt;img');
        });

        it('should throw when template file is not found', () => {
            mockJoin.mockReturnValue('/nonexistent/reset-password.html');
            mockFsReadFileSync.mockImplementation(() => {
                throw new Error('ENOENT');
            });

            const {
                renderResetPasswordEmailTemplate,
            } = require('@/modules/common/mail/reset-password-email.renderer');
            expect(() =>
                renderResetPasswordEmailTemplate({
                    correo: 'test@example.com',
                    token: 'token',
                }),
            ).toThrow(
                'No se pudo cargar la plantilla de restablecimiento de contraseña',
            );
        });
    });
});
