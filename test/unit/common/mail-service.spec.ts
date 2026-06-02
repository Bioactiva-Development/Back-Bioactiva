import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MailService } from '@/modules/common/mail/mail.service';
import { MockMailProvider } from '@/modules/common/mail/mock-mail.provider';
import { SmtpMailProvider } from '@/modules/common/mail/smtp-mail.provider';
import { GraphMailProvider } from '@/modules/common/mail/graph-mail.provider';
import { UserRole } from '@/shared/domain/enums/rol';

describe('MailService', () => {
    let mockMockProvider: jest.Mocked<MockMailProvider>;
    let mockSmtpProvider: jest.Mocked<SmtpMailProvider>;
    let mockGraphProvider: jest.Mocked<GraphMailProvider>;
    let mailService: MailService;
    const originalMailProvider = process.env.MAIL_PROVIDER;

    const invitationInput = {
        correo: 'user@example.com',
        token: 'token-abc',
        rol: UserRole.TRABAJADOR,
        invitedBy: 1,
    };

    const resetInput = {
        correo: 'user@example.com',
        token: 'token-reset',
    };

    beforeEach(() => {
        mockMockProvider = {
            sendInvitationEmail: jest.fn(),
            sendResetPasswordEmail: jest.fn(),
        } as unknown as jest.Mocked<MockMailProvider>;

        mockSmtpProvider = {
            sendInvitationEmail: jest.fn(),
            sendResetPasswordEmail: jest.fn(),
        } as unknown as jest.Mocked<SmtpMailProvider>;

        mockGraphProvider = {
            sendInvitationEmail: jest.fn(),
            sendResetPasswordEmail: jest.fn(),
        } as unknown as jest.Mocked<GraphMailProvider>;

        mailService = new MailService(mockMockProvider, mockSmtpProvider, mockGraphProvider);
        delete process.env.MAIL_PROVIDER;
    });

    afterEach(() => {
        if (originalMailProvider) {
            process.env.MAIL_PROVIDER = originalMailProvider;
        } else {
            delete process.env.MAIL_PROVIDER;
        }
    });

    describe('sendInvitationEmail', () => {
        it('should use mock provider when no MAIL_PROVIDER set', async () => {
            await mailService.sendInvitationEmail(invitationInput);
            expect(mockMockProvider.sendInvitationEmail).toHaveBeenCalledWith(invitationInput);
            expect(mockSmtpProvider.sendInvitationEmail).not.toHaveBeenCalled();
            expect(mockGraphProvider.sendInvitationEmail).not.toHaveBeenCalled();
        });

        it('should use mock provider by default', async () => {
            process.env.MAIL_PROVIDER = 'mock';
            await mailService.sendInvitationEmail(invitationInput);
            expect(mockMockProvider.sendInvitationEmail).toHaveBeenCalled();
        });

        it('should use smtp provider when MAIL_PROVIDER is smtp', async () => {
            process.env.MAIL_PROVIDER = 'smtp';
            await mailService.sendInvitationEmail(invitationInput);
            expect(mockSmtpProvider.sendInvitationEmail).toHaveBeenCalledWith(invitationInput);
            expect(mockMockProvider.sendInvitationEmail).not.toHaveBeenCalled();
            expect(mockGraphProvider.sendInvitationEmail).not.toHaveBeenCalled();
        });

        it('should use graph provider when MAIL_PROVIDER is graph', async () => {
            process.env.MAIL_PROVIDER = 'graph';
            await mailService.sendInvitationEmail(invitationInput);
            expect(mockGraphProvider.sendInvitationEmail).toHaveBeenCalledWith(invitationInput);
            expect(mockMockProvider.sendInvitationEmail).not.toHaveBeenCalled();
            expect(mockSmtpProvider.sendInvitationEmail).not.toHaveBeenCalled();
        });
    });

    describe('sendResetPasswordEmail', () => {
        it('should use mock provider by default', async () => {
            await mailService.sendResetPasswordEmail(resetInput);
            expect(mockMockProvider.sendResetPasswordEmail).toHaveBeenCalledWith(resetInput);
        });

        it('should use smtp provider when MAIL_PROVIDER is smtp', async () => {
            process.env.MAIL_PROVIDER = 'smtp';
            await mailService.sendResetPasswordEmail(resetInput);
            expect(mockSmtpProvider.sendResetPasswordEmail).toHaveBeenCalledWith(resetInput);
        });

        it('should use graph provider when MAIL_PROVIDER is graph', async () => {
            process.env.MAIL_PROVIDER = 'graph';
            await mailService.sendResetPasswordEmail(resetInput);
            expect(mockGraphProvider.sendResetPasswordEmail).toHaveBeenCalledWith(resetInput);
        });
    });
});
