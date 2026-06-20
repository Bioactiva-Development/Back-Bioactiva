import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ObtainResetInfoUseCase } from '@/modules/reset_password/application/use-cases/obtain-reset-info.use-case';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';
import { PasswordResetExpirationProcessor } from '@/modules/reset_password/infrastructure/queue/password-reset-expiration.processor';

/**
 * Branch coverage extra:
 *  - ObtainResetInfoUseCase: `if (!user)` -> usuario asociado no encontrado.
 *  - PasswordResetExpirationProcessor: `if (!expired)` -> token ya manejado
 *    antes de la expiración programada (no-op con log).
 */
describe('Reset password module — branches2', () => {
    describe('ObtainResetInfoUseCase', () => {
        let useCase: ObtainResetInfoUseCase;
        let passwordResetRepository: any;
        let userRepository: any;
        let hashService: any;

        const buildToken = () =>
            new PasswordResetToken(
                1,
                1,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date('2099-01-01T00:00:00.000Z'),
            );

        beforeEach(() => {
            passwordResetRepository = { findByToken: jest.fn() };
            userRepository = { findById: jest.fn() };
            hashService = { hash: jest.fn((t: string) => `hashed-${t}`) };
            useCase = new ObtainResetInfoUseCase(
                passwordResetRepository,
                userRepository,
                hashService,
            );
        });

        it('throws when the associated user is not found', async () => {
            passwordResetRepository.findByToken.mockResolvedValue(buildToken());
            userRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute('tok')).rejects.toThrow(
                InvalidResetTokenException,
            );
        });
    });

    describe('PasswordResetExpirationProcessor', () => {
        it('logs a no-op when the token was already handled (not expired)', async () => {
            const expireUseCase = {
                execute: jest.fn<any>().mockResolvedValue(false),
            };
            const processor = new PasswordResetExpirationProcessor(
                expireUseCase as any,
            );

            await processor.process({
                name: 'expire-password-reset-token',
                data: { resetTokenId: 7 },
            } as any);

            expect(expireUseCase.execute).toHaveBeenCalledWith(7);
        });
    });
});
