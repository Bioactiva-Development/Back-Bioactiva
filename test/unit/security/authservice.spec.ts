import { describe, expect, it, jest } from '@jest/globals';

import { AuthenticateUserUseCase } from '@/modules/auth/application/use-cases/authenticate-user.use-case';
import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { LoginCredentials } from '@/modules/auth/domain/value-objects/login_credentials';
import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';
import { User } from '@/modules/users/domain/entities/user';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '../../../src/shared/domain/enums/rol';

describe('Security module', () => {
    /**
     * AuthService
     * ----------
     * Responsable de:
     * - login de usuarios
     * - validación de credenciales
     * - generación y renovación de tokens
     */
    // STATUS: Implementación parcial (login, refresh de sesión y retorno de usuario autenticado).
    describe('Authentication and session management', () => {
        const createdAt = new Date('2024-01-01T00:00:00.000Z');
        const updatedAt = new Date('2024-01-02T00:00:00.000Z');

        const buildActiveUser = () =>
            new User(
                1,
                'Ana',
                'Paredes',
                'ana@bioactiva.com',
                'hashed-password',
                createdAt,
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                updatedAt,
            );

        const buildInactiveUser = () =>
            new User(
                2,
                'Luis',
                'Perez',
                'luis@bioactiva.com',
                'hashed-password',
                createdAt,
                UserRole.TRABAJADOR,
                UserState.PENDIENTE,
                updatedAt,
            );

        it('should authenticate a valid user and issue a token pair', async () => {
            const activeUser = buildActiveUser();
            const authUserRepository: any = {
                findByCorreo: jest.fn() as any,
            };
            authUserRepository.findByCorreo.mockResolvedValue(activeUser);

            const passwordHasher: any = {
                compare: jest.fn() as any,
            };
            passwordHasher.compare.mockResolvedValue(true);

            const tokenService: any = {
                signAccessToken: jest.fn() as any,
                signRefreshToken: jest.fn() as any,
            };
            tokenService.signAccessToken.mockResolvedValue('access-token');
            tokenService.signRefreshToken.mockResolvedValue('refresh-token');

            const useCase = new AuthenticateUserUseCase(
                authUserRepository,
                passwordHasher,
                tokenService,
            );

            await expect(
                useCase.execute(
                    new LoginCredentials('ana@bioactiva.com', 'secret'),
                ),
            ).resolves.toEqual(
                new TokenPair('access-token', 'refresh-token', 900, 604800),
            );
            expect(authUserRepository.findByCorreo).toHaveBeenCalledWith(
                'ana@bioactiva.com',
            );
            expect(passwordHasher.compare).toHaveBeenCalledWith(
                'secret',
                activeUser.password,
            );
            expect(tokenService.signAccessToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    sub: '1',
                    correo: activeUser.correo,
                    nombres: activeUser.nombres,
                    apellidos: activeUser.apellidos,
                    role: activeUser.role,
                    estado: activeUser.estado,
                }),
            );
        });

        it('should reject login when the user does not exist', async () => {
            const authUserRepository: any = {
                findByCorreo: jest.fn() as any,
            };
            authUserRepository.findByCorreo.mockResolvedValue(null);

            const passwordHasher: any = {
                compare: jest.fn() as any,
            };
            const tokenService: any = {
                signAccessToken: jest.fn() as any,
                signRefreshToken: jest.fn() as any,
            };

            const useCase = new AuthenticateUserUseCase(
                authUserRepository,
                passwordHasher,
                tokenService,
            );

            await expect(
                useCase.execute(
                    new LoginCredentials('ana@bioactiva.com', 'secret'),
                ),
            ).rejects.toThrow('Credenciales inválidas');
            expect(passwordHasher.compare).not.toHaveBeenCalled();
            expect(tokenService.signAccessToken).not.toHaveBeenCalled();
        });

        it('should reject login when the password does not match', async () => {
            const activeUser = buildActiveUser();
            const authUserRepository: any = {
                findByCorreo: jest.fn() as any,
            };
            authUserRepository.findByCorreo.mockResolvedValue(activeUser);

            const passwordHasher: any = {
                compare: jest.fn() as any,
            };
            passwordHasher.compare.mockResolvedValue(false);

            const tokenService: any = {
                signAccessToken: jest.fn() as any,
                signRefreshToken: jest.fn() as any,
            };

            const useCase = new AuthenticateUserUseCase(
                authUserRepository,
                passwordHasher,
                tokenService,
            );

            await expect(
                useCase.execute(
                    new LoginCredentials('ana@bioactiva.com', 'wrong'),
                ),
            ).rejects.toThrow('Credenciales inválidas');
            expect(tokenService.signAccessToken).not.toHaveBeenCalled();
        });

        it('should allow the refresh use case to issue new tokens for a valid session', async () => {
            const activeUser = buildActiveUser();
            const tokenPair = new TokenPair(
                'new-access',
                'new-refresh',
                900,
                604800,
            );
            const verifyRefreshToken = jest.fn() as any;
            verifyRefreshToken.mockResolvedValue({
                sub: '1',
                tokenVersion: 2,
            });

            const signAccessToken = jest.fn() as any;
            signAccessToken.mockResolvedValue('new-access');

            const signRefreshToken = jest.fn() as any;
            signRefreshToken.mockResolvedValue('new-refresh');

            const findById = jest.fn() as any;
            findById.mockResolvedValue(activeUser);

            const tokenService: any = {
                verifyRefreshToken,
                signAccessToken,
                signRefreshToken,
            };
            const authUserRepository: any = {
                findById,
            };
            const useCase = new RefreshSessionUseCase(
                tokenService as never,
                authUserRepository as never,
            );

            await expect(useCase.execute('refresh-token')).resolves.toEqual(
                tokenPair,
            );
            expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
                'refresh-token',
            );
            expect(authUserRepository.findById).toHaveBeenCalledWith(1);
            expect(tokenService.signAccessToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    sub: '1',
                    correo: activeUser.correo,
                    nombres: activeUser.nombres,
                    apellidos: activeUser.apellidos,
                    role: activeUser.role,
                    estado: activeUser.estado,
                    tokenVersion: 2,
                }),
            );
        });

        it('should reject refresh when the user does not exist', async () => {
            const verifyRefreshToken = jest.fn() as any;
            verifyRefreshToken.mockResolvedValue({
                sub: '1',
            });

            const tokenService: any = {
                verifyRefreshToken,
                signAccessToken: jest.fn() as any,
                signRefreshToken: jest.fn() as any,
            };
            const authUserRepository: any = {
                findById: jest.fn() as any,
            };
            authUserRepository.findById.mockResolvedValue(null);

            const useCase = new RefreshSessionUseCase(
                tokenService,
                authUserRepository,
            );

            await expect(useCase.execute('refresh-token')).rejects.toThrow(
                'Credenciales inválidas',
            );
            expect(tokenService.signAccessToken).not.toHaveBeenCalled();
        });

        it('should reject login when the user is inactive', async () => {
            const inactiveUser = buildInactiveUser();
            const findByCorreo = jest.fn() as any;
            findByCorreo.mockResolvedValue(inactiveUser);

            const authUserRepository: any = {
                findByCorreo,
            };
            const passwordHasher: any = {
                compare: jest.fn(),
            };
            const tokenService: any = {
                signAccessToken: jest.fn(),
                signRefreshToken: jest.fn(),
            };
            const useCase = new AuthenticateUserUseCase(
                authUserRepository as never,
                passwordHasher as never,
                tokenService as never,
            );

            await expect(
                useCase.execute(
                    new LoginCredentials('luis@bioactiva.com', 'secret'),
                ),
            ).rejects.toThrow('El usuario no está activo');
            expect(passwordHasher.compare).not.toHaveBeenCalled();
            expect(tokenService.signAccessToken).not.toHaveBeenCalled();
        });
    });
});
