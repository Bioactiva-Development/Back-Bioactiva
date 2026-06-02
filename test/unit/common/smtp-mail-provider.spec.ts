import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockSendInvitationEmail = jest.fn();
const mockSendResetPasswordEmail = jest.fn();

jest.mock('@/modules/common/mail/resend.instance', () => ({
    ResendMailProvider: jest.fn().mockImplementation(() => ({
        sendInvitationEmail: mockSendInvitationEmail,
        sendResetPasswordEmail: mockSendResetPasswordEmail,
    })),
}));

jest.mock('node:fs', () => ({
    readFileSync: jest.fn().mockReturnValue('<html>test</html>'),
}));

jest.mock('node:path', () => ({
    join: jest.fn().mockReturnValue('/fake/path/template.html'),
}));

import { SmtpMailProvider } from '@/modules/common/mail/smtp-mail.provider';

describe('SmtpMailProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delegate invitation email to ResendMailProvider', async () => {
        const provider = new SmtpMailProvider();
        mockSendInvitationEmail.mockResolvedValue(undefined);

        await provider.sendInvitationEmail({
            correo: 'user@test.com',
            token: 'token-abc',
            rol: 1 as any,
            invitedBy: 1,
        });

        expect(mockSendInvitationEmail).toHaveBeenCalledWith({
            correo: 'user@test.com',
            token: 'token-abc',
            rol: 1,
            invitedBy: 1,
        });
    });

    it('should delegate reset password email to ResendMailProvider', async () => {
        const provider = new SmtpMailProvider();
        mockSendResetPasswordEmail.mockResolvedValue(undefined);

        await provider.sendResetPasswordEmail({
            correo: 'user@test.com',
            token: 'token-reset',
        });

        expect(mockSendResetPasswordEmail).toHaveBeenCalledWith({
            correo: 'user@test.com',
            token: 'token-reset',
        });
    });
});
