import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ExpirePasswordResetTokenUseCase } from '@/modules/reset_password/application/use-cases/expire-password-reset-token.use-case';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

describe('Reset Password module', () => {
    /**
     * ExpirePasswordResetTokenUseCase (real implementation)
     * ----------
     * Expira un token de reseteo pendiente. Idempotente: si el token no existe
     * o ya no está pendiente, devuelve false sin tocar persistencia.
     */
    describe('ExpirePasswordResetTokenUseCase', () => {
        let useCase: ExpirePasswordResetTokenUseCase;
        let passwordResetRepository: any;

        const makeToken = (estado: TokenStatus) =>
            new PasswordResetToken(
                1,
                1,
                'hashed-token',
                estado,
                new Date(),
                null,
                new Date(Date.now() + 60 * 60 * 1000),
            );

        beforeEach(() => {
            passwordResetRepository = {
                findById: jest.fn(),
                save: jest.fn(),
            };

            useCase = new ExpirePasswordResetTokenUseCase(
                passwordResetRepository,
            );
        });

        it('should return false when the token does not exist', async () => {
            passwordResetRepository.findById.mockResolvedValue(null);

            const result = await useCase.execute(999);

            expect(result).toBe(false);
            expect(passwordResetRepository.save).not.toHaveBeenCalled();
        });

        it('should return false when the token is not pending', async () => {
            passwordResetRepository.findById.mockResolvedValue(
                makeToken(TokenStatus.CONSUMIDO),
            );

            const result = await useCase.execute(1);

            expect(result).toBe(false);
            expect(passwordResetRepository.save).not.toHaveBeenCalled();
        });

        it('should expire a pending token, persist it and return true', async () => {
            const token = makeToken(TokenStatus.PENDIENTE);
            passwordResetRepository.findById.mockResolvedValue(token);
            passwordResetRepository.save.mockResolvedValue(token);

            const result = await useCase.execute(1);

            expect(result).toBe(true);
            expect(token.estado).toBe(TokenStatus.EXPIRADO);
            expect(passwordResetRepository.save).toHaveBeenCalledWith(token);
        });
    });
});
