import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ObtainResetInfoUseCase } from '@/modules/reset_password/application/use-cases/obtain-reset-info.use-case';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Reset password module', () => {
    /**
     * ObtainResetInfoUseCase (Mantis #240)
     * ----------
     * Resuelve la URL del enlace de recuperación y reporta el estado del token
     * (expirado / usado) sin mutarlo, para validación temprana en el frontend.
     */
    describe('ObtainResetInfoUseCase', () => {
        let useCase: ObtainResetInfoUseCase;
        let passwordResetRepository: any;
        let userRepository: any;
        let hashService: any;

        const buildUser = () =>
            new User(
                1,
                'Juan',
                'Perez',
                'juan@bioactiva.com',
                'hashed',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

        const buildToken = (estado: TokenStatus, expiresAt: Date) =>
            new PasswordResetToken(
                1,
                1,
                'hashed-token',
                estado,
                new Date(),
                null,
                expiresAt,
            );

        beforeEach(() => {
            passwordResetRepository = {
                findByToken: jest.fn(),
                save: jest.fn(),
            };
            userRepository = {
                findById: jest.fn(() => Promise.resolve(buildUser())),
            };
            hashService = {
                hash: jest.fn((t: string) => `hashed-${t}`),
            };

            useCase = new ObtainResetInfoUseCase(
                passwordResetRepository,
                userRepository,
                hashService,
            );
        });

        it('should report a valid token as not expired and not used', async () => {
            passwordResetRepository.findByToken.mockResolvedValue(
                buildToken(
                    TokenStatus.PENDIENTE,
                    new Date(Date.now() + 60 * 60 * 1000),
                ),
            );

            const result = await useCase.execute('raw-token');

            expect(result.expired).toBe(false);
            expect(result.used).toBe(false);
            expect(result.correo).toContain('@bioactiva.com');
            // No debe mutar el token (lectura pura)
            expect(passwordResetRepository.save).not.toHaveBeenCalled();
        });

        it('should report expired:true when the token is past its expiration', async () => {
            passwordResetRepository.findByToken.mockResolvedValue(
                buildToken(
                    TokenStatus.PENDIENTE,
                    new Date(Date.now() - 1000),
                ),
            );

            const result = await useCase.execute('raw-token');

            expect(result.expired).toBe(true);
            expect(passwordResetRepository.save).not.toHaveBeenCalled();
        });

        it('should report expired:true when the token estado is EXPIRADO', async () => {
            passwordResetRepository.findByToken.mockResolvedValue(
                buildToken(
                    TokenStatus.EXPIRADO,
                    new Date(Date.now() + 60 * 60 * 1000),
                ),
            );

            const result = await useCase.execute('raw-token');

            expect(result.expired).toBe(true);
        });

        it('should report used:true when the token was already consumed', async () => {
            passwordResetRepository.findByToken.mockResolvedValue(
                buildToken(
                    TokenStatus.CONSUMIDO,
                    new Date(Date.now() + 60 * 60 * 1000),
                ),
            );

            const result = await useCase.execute('raw-token');

            expect(result.used).toBe(true);
        });

        it('should throw InvalidResetTokenException when token does not exist', async () => {
            passwordResetRepository.findByToken.mockResolvedValue(null);

            await expect(useCase.execute('missing')).rejects.toThrow(
                InvalidResetTokenException,
            );
        });
    });
});
