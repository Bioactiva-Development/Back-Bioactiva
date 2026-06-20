import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MailService } from '@/modules/common/mail/mail.service';
import { MockMailProvider } from '@/modules/common/mail/mock-mail.provider';
import { SmtpMailProvider } from '@/modules/common/mail/smtp-mail.provider';
import { GraphMailProvider } from '@/modules/common/mail/graph-mail.provider';

describe('MailService — sendGenericEmail provider selection', () => {
    let mockMockProvider: jest.Mocked<MockMailProvider>;
    let mockSmtpProvider: jest.Mocked<SmtpMailProvider>;
    let mockGraphProvider: jest.Mocked<GraphMailProvider>;
    let mailService: MailService;
    const originalMailProvider = process.env.MAIL_PROVIDER;

    const genericInput = {
        to: 'user@example.com',
        subject: 'Asunto',
        html: '<p>Hola</p>',
    };

    beforeEach(() => {
        mockMockProvider = {
            sendGenericEmail: jest.fn(),
        } as unknown as jest.Mocked<MockMailProvider>;

        mockSmtpProvider = {
            sendGenericEmail: jest.fn(),
        } as unknown as jest.Mocked<SmtpMailProvider>;

        mockGraphProvider = {
            sendGenericEmail: jest.fn(),
        } as unknown as jest.Mocked<GraphMailProvider>;

        mailService = new MailService(
            mockMockProvider,
            mockSmtpProvider,
            mockGraphProvider,
        );
        delete process.env.MAIL_PROVIDER;
    });

    afterEach(() => {
        if (originalMailProvider) {
            process.env.MAIL_PROVIDER = originalMailProvider;
        } else {
            delete process.env.MAIL_PROVIDER;
        }
    });

    it('uses the graph provider when MAIL_PROVIDER is graph', async () => {
        process.env.MAIL_PROVIDER = 'graph';
        await mailService.sendGenericEmail(genericInput);
        expect(mockGraphProvider.sendGenericEmail).toHaveBeenCalledWith(
            genericInput,
        );
        expect(mockSmtpProvider.sendGenericEmail).not.toHaveBeenCalled();
        expect(mockMockProvider.sendGenericEmail).not.toHaveBeenCalled();
    });

    it('uses the smtp provider when MAIL_PROVIDER is smtp', async () => {
        process.env.MAIL_PROVIDER = 'smtp';
        await mailService.sendGenericEmail(genericInput);
        expect(mockSmtpProvider.sendGenericEmail).toHaveBeenCalledWith(
            genericInput,
        );
        expect(mockGraphProvider.sendGenericEmail).not.toHaveBeenCalled();
        expect(mockMockProvider.sendGenericEmail).not.toHaveBeenCalled();
    });

    it('falls back to the mock provider when MAIL_PROVIDER is unset', async () => {
        await mailService.sendGenericEmail(genericInput);
        expect(mockMockProvider.sendGenericEmail).toHaveBeenCalledWith(
            genericInput,
        );
        expect(mockGraphProvider.sendGenericEmail).not.toHaveBeenCalled();
        expect(mockSmtpProvider.sendGenericEmail).not.toHaveBeenCalled();
    });

    it('falls back to the mock provider when MAIL_PROVIDER is unrecognized', async () => {
        process.env.MAIL_PROVIDER = 'sendgrid';
        await mailService.sendGenericEmail(genericInput);
        expect(mockMockProvider.sendGenericEmail).toHaveBeenCalledWith(
            genericInput,
        );
    });

    it('warns only once even across multiple mock fallbacks', async () => {
        await mailService.sendGenericEmail(genericInput);
        // Second call on the same instance must not re-warn (warnedMock guard).
        await mailService.sendGenericEmail(genericInput);
        expect(mockMockProvider.sendGenericEmail).toHaveBeenCalledTimes(2);
    });
});
