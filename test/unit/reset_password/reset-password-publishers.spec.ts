import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PasswordResetEmailPublisher, RESET_PASSWORD_EMAIL_QUEUE } from '@/modules/reset_password/infrastructure/queue/password-reset-email.publisher';
import { PasswordResetExpirationPublisher, RESET_PASSWORD_EXPIRATION_QUEUE } from '@/modules/reset_password/infrastructure/queue/password-reset-expiration.publisher';
import { Queue } from 'bullmq';

describe('Reset Password Publishers', () => {
    let mockQueue: jest.Mocked<Queue>;

    beforeEach(() => {
        mockQueue = {
            add: jest.fn(),
        } as unknown as jest.Mocked<Queue>;
    });

    describe('PasswordResetEmailPublisher', () => {
        it('should enqueue reset password email with correct data', async () => {
            const publisher = new PasswordResetEmailPublisher(mockQueue);
            await publisher.sendResetPasswordEmail('user@example.com', 'token-abc');

            expect(mockQueue.add).toHaveBeenCalledWith(
                'send-reset-password-email',
                { correo: 'user@example.com', token: 'token-abc' },
                expect.objectContaining({ attempts: 3, removeOnComplete: true }),
            );
        });
    });

    describe('PasswordResetExpirationPublisher', () => {
        it('should schedule expiration with positive delay', async () => {
            const publisher = new PasswordResetExpirationPublisher(mockQueue);
            const futureDate = new Date(Date.now() + 3600000);
            await publisher.scheduleExpiration({
                resetTokenId: 1,
                expiresAt: futureDate,
            });

            expect(mockQueue.add).toHaveBeenCalledWith(
                'expire-password-reset-token',
                { resetTokenId: 1 },
                expect.objectContaining({
                    jobId: 'expire-password-reset-1',
                    attempts: 1,
                    removeOnComplete: true,
                }),
            );
        });

        it('should use delay 0 when expiresAt is in the past', async () => {
            const publisher = new PasswordResetExpirationPublisher(mockQueue);
            const pastDate = new Date(Date.now() - 3600000);
            await publisher.scheduleExpiration({
                resetTokenId: 2,
                expiresAt: pastDate,
            });

            expect(mockQueue.add).toHaveBeenCalledWith(
                'expire-password-reset-token',
                { resetTokenId: 2 },
                expect.objectContaining({ delay: 0 }),
            );
        });
    });
});
