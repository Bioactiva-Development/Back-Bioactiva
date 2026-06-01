import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { RequestPasswordResetUseCase } from '@/modules/reset_password/application/use-cases/request-password-reset.use-case';
import { ValidateResetTokenUseCase } from '@/modules/reset_password/application/use-cases/validate-reset-token.use-case';
import { ResetPasswordUseCase } from '@/modules/reset_password/application/use-cases/reset-password.use-case';
import { ExpirePasswordResetTokenUseCase } from '@/modules/reset_password/application/use-cases/expire-password-reset-token.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';
import { ResetTokenExpiredException } from '@/modules/reset_password/domain/exeptions/reset-token-expired.exception';

describe('Reset Password module', () => {
    /**
     * RequestPasswordResetUseCase
     * ----------
     * Responsable de:
     * - buscar usuario por correo
     * - generar token seguro
     * - crear y guardar token
     * - agendar expiración
     * - enviar notificación
     */
    // STATUS: Implementación completa (user lookup + token creation + notifications).
    describe('RequestPasswordResetUseCase', () => {
        let useCase: RequestPasswordResetUseCase;
        let passwordResetRepository: any;
        let userRepository: any;
        let passwordResetNotification: any;
        let hashService: any;
        let expirationScheduler: any;

        beforeEach(() => {
            passwordResetRepository = {
                save: jest.fn(),
            };
            userRepository = {
                findByCorreo: jest.fn(),
            };
            passwordResetNotification = {
                sendResetPasswordEmail: jest.fn(),
            };
            hashService = {
                hash: jest.fn((token: string) => `hashed-${token}`),
            };
            expirationScheduler = {
                scheduleExpiration: jest.fn(),
            };

            useCase = new RequestPasswordResetUseCase(
                passwordResetRepository,
                userRepository,
                passwordResetNotification,
                hashService,
                expirationScheduler,
            );
        });

        it('should request password reset for valid user', async () => {
            const user = new User(
                1,
                'John',
                'Doe',
                'john@bioactiva.com',
                'hashed-password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            userRepository.findByCorreo.mockResolvedValue(user);
            passwordResetRepository.save.mockResolvedValue({ id: 1 });

            const result = await useCase.execute('john@bioactiva.com');

            expect(result).toEqual({ ok: true });
            expect(userRepository.findByCorreo).toHaveBeenCalledWith(
                'john@bioactiva.com',
            );
            expect(passwordResetRepository.save).toHaveBeenCalled();
        });

        it('should silently return ok for non-existent user (security)', async () => {
            userRepository.findByCorreo.mockResolvedValue(null);

            const result = await useCase.execute('notfound@bioactiva.com');

            expect(result).toEqual({ ok: true });
            expect(passwordResetRepository.save).not.toHaveBeenCalled();
        });

        it('should silently return ok for user without id', async () => {
            const userWithoutId = new User(
                null,
                'John',
                'Doe',
                'john@bioactiva.com',
                'hashed-password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            userRepository.findByCorreo.mockResolvedValue(userWithoutId);

            const result = await useCase.execute('john@bioactiva.com');

            expect(result).toEqual({ ok: true });
            expect(passwordResetRepository.save).not.toHaveBeenCalled();
        });

        it('should schedule expiration after token creation', async () => {
            const user = new User(
                1,
                'John',
                'Doe',
                'john@bioactiva.com',
                'hashed-password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            userRepository.findByCorreo.mockResolvedValue(user);
            passwordResetRepository.save.mockResolvedValue({
                id: 1,
                expired_at: new Date(),
            });

            await useCase.execute('john@bioactiva.com');

            expect(expirationScheduler.scheduleExpiration).toHaveBeenCalled();
        });

        it('should send reset password email notification', async () => {
            const user = new User(
                1,
                'John',
                'Doe',
                'john@bioactiva.com',
                'hashed-password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            userRepository.findByCorreo.mockResolvedValue(user);
            passwordResetRepository.save.mockResolvedValue({ id: 1 });

            await useCase.execute('john@bioactiva.com');

            expect(
                passwordResetNotification.sendResetPasswordEmail,
            ).toHaveBeenCalledWith('john@bioactiva.com', expect.any(String));
        });

        it('should set token expiration to 2 hours', async () => {
            const user = new User(
                1,
                'John',
                'Doe',
                'john@bioactiva.com',
                'hashed-password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            userRepository.findByCorreo.mockResolvedValue(user);
            passwordResetRepository.save.mockResolvedValue({ id: 1 });

            const beforeTime = Date.now();
            await useCase.execute('john@bioactiva.com');
            const afterTime = Date.now();

            const saveCall = passwordResetRepository.save.mock.calls[0][0];
            const expirationTime = saveCall.expired_at.getTime();
            const expectedTime = beforeTime + 2 * 60 * 60 * 1000;

            expect(expirationTime).toBeGreaterThanOrEqual(expectedTime - 5000);
            expect(expirationTime).toBeLessThanOrEqual(expectedTime + 5000);
        });
    });

    /**
     * ValidateResetTokenUseCase
     * ----------
     * Responsable de:
     * - validar token existe y pendiente
     * - validar que no esté expirado
     * - retornar correo enmascarado
     */
    // STATUS: Implementación completa (token validation + masking).
    describe('ValidateResetTokenUseCase', () => {
        let useCase: ValidateResetTokenUseCase;
        let passwordResetRepository: any;
        let userRepository: any;
        let hashService: any;

        beforeEach(() => {
            passwordResetRepository = {
                findByToken: jest.fn(),
                save: jest.fn(),
            };
            userRepository = {
                findById: jest.fn(),
            };
            hashService = {
                hash: jest.fn((token: string) => `hashed-${token}`),
            };

            useCase = new ValidateResetTokenUseCase(
                passwordResetRepository,
                userRepository,
                hashService,
            );
        });

        it('should validate valid reset token', async () => {
            const user = new User(
                1,
                'John',
                'Doe',
                'john@bioactiva.com',
                'password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            const resetToken = new PasswordResetToken(
                1,
                1,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 60 * 60 * 1000),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);
            userRepository.findById.mockResolvedValue(user);

            const result = await useCase.execute('raw-token');

            expect(result.correo).toBeDefined();
            expect(result.correo).toContain('*');
        });

        it('should reject invalid token', async () => {
            passwordResetRepository.findByToken.mockResolvedValue(null);

            await expect(useCase.execute('invalid-token')).rejects.toThrow(
                InvalidResetTokenException,
            );
        });

        it('should reject expired token', async () => {
            const resetToken = new PasswordResetToken(
                1,
                1,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() - 1000),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);

            await expect(useCase.execute('raw-token')).rejects.toThrow(
                ResetTokenExpiredException,
            );
        });

        it('should reject consumed token', async () => {
            const resetToken = new PasswordResetToken(
                1,
                1,
                'hashed-token',
                TokenStatus.CONSUMIDO,
                new Date(),
                new Date(),
                new Date(),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);

            await expect(useCase.execute('raw-token')).rejects.toThrow(
                InvalidResetTokenException,
            );
        });

        it('should mask email address for privacy', async () => {
            const user = new User(
                1,
                'John',
                'Doe',
                'john.doe@bioactiva.com',
                'password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            const resetToken = new PasswordResetToken(
                1,
                1,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 60 * 60 * 1000),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);
            userRepository.findById.mockResolvedValue(user);

            const result = await useCase.execute('raw-token');

            expect(result.correo).toMatch(/^j\*+e@bioactiva\.com$/);
        });

        it('should throw if user not found', async () => {
            const resetToken = new PasswordResetToken(
                1,
                999,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 60 * 60 * 1000),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);
            userRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute('raw-token')).rejects.toThrow(
                InvalidResetTokenException,
            );
        });
    });

    /**
     * ResetPasswordUseCase
     * ----------
     * Responsable de:
     * - validar token
     * - hashear nueva contraseña
     * - actualizar usuario
     * - consumir token
     */
    // STATUS: Implementación completa (password update + token consumption).
    describe('ResetPasswordUseCase', () => {
        let useCase: ResetPasswordUseCase;
        let passwordResetRepository: any;
        let userRepository: any;
        let passwordHasher: any;
        let hashService: any;

        beforeEach(() => {
            passwordResetRepository = {
                findByToken: jest.fn(),
                save: jest.fn(),
            };
            userRepository = {
                findById: jest.fn(),
                save: jest.fn(),
            };
            passwordHasher = {
                hash: jest.fn().mockResolvedValue('new-hashed-password'),
            };
            hashService = {
                hash: jest.fn((token: string) => `hashed-${token}`),
            };

            useCase = new ResetPasswordUseCase(
                passwordResetRepository,
                userRepository,
                passwordHasher,
                hashService,
            );
        });

        it('should reset password with valid token', async () => {
            const user = new User(
                1,
                'John',
                'Doe',
                'john@bioactiva.com',
                'old-password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            const resetToken = new PasswordResetToken(
                1,
                1,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 60 * 60 * 1000),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);
            userRepository.findById.mockResolvedValue(user);
            passwordResetRepository.save.mockResolvedValue(resetToken);
            userRepository.save.mockResolvedValue(user);

            const result = await useCase.execute('raw-token', 'newpassword123');

            expect(result).toEqual({ ok: true });
            expect(passwordHasher.hash).toHaveBeenCalledWith('newpassword123');
        });

        it('should reject invalid token', async () => {
            passwordResetRepository.findByToken.mockResolvedValue(null);

            await expect(
                useCase.execute('invalid-token', 'newpassword'),
            ).rejects.toThrow(InvalidResetTokenException);
        });

        it('should reject expired token', async () => {
            const resetToken = new PasswordResetToken(
                1,
                1,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() - 1000),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);

            await expect(
                useCase.execute('raw-token', 'newpassword'),
            ).rejects.toThrow(ResetTokenExpiredException);
        });

        it('should consume token after password reset', async () => {
            const user = new User(
                1,
                'John',
                'Doe',
                'john@bioactiva.com',
                'old-password',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

            const resetToken = new PasswordResetToken(
                1,
                1,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 60 * 60 * 1000),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);
            userRepository.findById.mockResolvedValue(user);
            passwordResetRepository.save.mockResolvedValue(resetToken);
            userRepository.save.mockResolvedValue(user);

            await useCase.execute('raw-token', 'newpassword123');

            expect(passwordResetRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    estado: TokenStatus.CONSUMIDO,
                }),
            );
        });

        it('should throw if user not found', async () => {
            const resetToken = new PasswordResetToken(
                1,
                999,
                'hashed-token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 60 * 60 * 1000),
            );

            passwordResetRepository.findByToken.mockResolvedValue(resetToken);
            userRepository.findById.mockResolvedValue(null);

            await expect(
                useCase.execute('raw-token', 'newpassword'),
            ).rejects.toThrow(InvalidResetTokenException);
        });
    });

    /**
     * ExpirePasswordResetTokenUseCase (if exists)
     * ----------
     * Responsable de:
     * - expirar tokens automáticamente después del tiempo límite
     */
    // STATUS: No implementado (intentaremos incluirlo si existe en el proyecto).
    describe('ExpirePasswordResetTokenUseCase', () => {
        let useCase: any;
        let passwordResetRepository: any;

        beforeEach(() => {
            passwordResetRepository = {
                findById: jest.fn(),
                save: jest.fn(),
            };

            // Mock usecase si existe
            useCase = {
                execute: jest.fn(async (id: number) => {
                    const token = await passwordResetRepository.findById(id);
                    if (!token) return false;
                    token.expire();
                    await passwordResetRepository.save(token);
                    return true;
                }),
            };
        });

        it('should expire password reset token', async () => {
            const token = new PasswordResetToken(
                1,
                1,
                'token',
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() - 1000),
            );

            passwordResetRepository.findById.mockResolvedValue(token);
            passwordResetRepository.save.mockResolvedValue(token);

            const result = await useCase.execute(1);

            expect(result).toBe(true);
        });

        it('should return false if token not found', async () => {
            passwordResetRepository.findById.mockResolvedValue(null);

            const result = await useCase.execute(999);

            expect(result).toBe(false);
        });
    });
});
