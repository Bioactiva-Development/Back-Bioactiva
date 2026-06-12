import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PasswordResetEmailProcessor } from '@/modules/reset_password/infrastructure/mail/password-reset-email.processor';
import { PasswordResetExpirationProcessor } from '@/modules/reset_password/infrastructure/queue/password-reset-expiration.processor';
import { MailService } from '@/modules/common/mail/mail.service';
import { ExpirePasswordResetTokenUseCase } from '@/modules/reset_password/application/use-cases/expire-password-reset-token.use-case';

describe('Reset Password Processors', () => {
    let mockMailService: jest.Mocked<MailService>;
    let mockExpirePasswordResetTokenUseCase: jest.Mocked<ExpirePasswordResetTokenUseCase>;

    const makeJob = (name: string, data: any) =>
        ({
            name,
            data,
        }) as any;

    beforeEach(() => {
        mockMailService = {
            sendResetPasswordEmail: jest.fn(),
            sendInvitationEmail: jest.fn(),
        } as any;
        mockExpirePasswordResetTokenUseCase = { execute: jest.fn() } as any;
    });

    describe('PasswordResetEmailProcessor', () => {
        it('should send reset password email for matching job name', async () => {
            const processor = new PasswordResetEmailProcessor(mockMailService);
            const job = makeJob('send-reset-password-email', {
                correo: 'user@test.com',
                token: 'token-abc',
            });

            await processor.process(job);

            expect(mockMailService.sendResetPasswordEmail).toHaveBeenCalledWith(
                job.data,
            );
        });

        it('should skip processing for non-matching job name', async () => {
            const processor = new PasswordResetEmailProcessor(mockMailService);
            const job = makeJob('other-job', { correo: 'user@test.com' });

            await processor.process(job);

            expect(
                mockMailService.sendResetPasswordEmail,
            ).not.toHaveBeenCalled();
        });
    });

    describe('PasswordResetExpirationProcessor', () => {
        it('should expire token for matching job name', async () => {
            const processor = new PasswordResetExpirationProcessor(
                mockExpirePasswordResetTokenUseCase,
            );
            mockExpirePasswordResetTokenUseCase.execute.mockResolvedValue(true);

            await processor.process(
                makeJob('expire-password-reset-token', { resetTokenId: 1 }),
            );

            expect(
                mockExpirePasswordResetTokenUseCase.execute,
            ).toHaveBeenCalledWith(1);
        });

        it('should skip processing for non-matching job name', async () => {
            const processor = new PasswordResetExpirationProcessor(
                mockExpirePasswordResetTokenUseCase,
            );
            const job = makeJob('other-job', { resetTokenId: 1 });

            await processor.process(job);

            expect(
                mockExpirePasswordResetTokenUseCase.execute,
            ).not.toHaveBeenCalled();
        });
    });
});
