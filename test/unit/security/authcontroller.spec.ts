import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';

import { AuthController } from '@/modules/auth/infrastructure/http/auth.controller';
import { AuthenticateUserUseCase } from '@/modules/auth/application/use-cases/authenticate-user.use-case';
import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';
import { InvalidCredentialsError } from '@/modules/auth/application/errors/invalid-credentials.error';
import { NotAuthorizedException } from '@/modules/auth/domain/exceptions/not-authorized.exeption';
import { User } from '@/modules/users/domain/entities/user';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '@/shared/enums/rol';

describe('Security module', () => {
	/**
	 * AuthController
	 * ----------
	 * Responsable de:
	 * - mapeo de DTOs de login y refresh
	 * - gestión de cookies (set/clear)
	 * - mapeo de errores a excepciones HTTP
	 * - manejo de endpoint me() para usuario autenticado
	 */
	// STATUS: Implementación completa (endpoints login, refresh, me + cookie lifecycle + error mapping).
	describe('AuthController HTTP endpoints', () => {
		let controller: AuthController;
		let authenticateUserUseCase: jest.Mocked<AuthenticateUserUseCase>;
		let refreshSessionUseCase: jest.Mocked<RefreshSessionUseCase>;
		let responseMock: jest.Mocked<Response>;

		const createdAt = new Date('2024-01-01T00:00:00.000Z');
		const updatedAt = new Date('2024-01-02T00:00:00.000Z');

		const buildUser = () =>
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

		const buildTokenPair = () =>
			new TokenPair(
				'access-token-value',
				'refresh-token-value',
				900, // 15 min
				604800, // 7 days
			);

		beforeEach(() => {
			authenticateUserUseCase = {
				execute: jest.fn(),
			} as unknown as jest.Mocked<AuthenticateUserUseCase>;

			refreshSessionUseCase = {
				execute: jest.fn(),
			} as unknown as jest.Mocked<RefreshSessionUseCase>;

			controller = new AuthController(
				authenticateUserUseCase,
				refreshSessionUseCase,
			);

			responseMock = {
				cookie: jest.fn().mockReturnValue(responseMock),
			} as unknown as jest.Mocked<Response>;
		});

		describe('login endpoint', () => {
			it('should return access token and set refresh token cookie on successful login', async () => {
				const tokenPair = buildTokenPair();
				authenticateUserUseCase.execute.mockResolvedValue(tokenPair);

				const result = await controller.login(
					{ correo: 'ana@bioactiva.com', password: 'password' },
					responseMock,
				);

				expect(result).toEqual({
					accessToken: 'access-token-value',
					accessTokenExpiresIn: 900,
				});
				expect(responseMock.cookie).toHaveBeenCalledWith(
					'refreshToken',
					'refresh-token-value',
					expect.objectContaining({
						httpOnly: true,
						path: '/auth/refresh',
					}),
				);
			});

			it('should throw UnauthorizedException on invalid credentials', async () => {
				authenticateUserUseCase.execute.mockRejectedValue(
					new InvalidCredentialsError(),
				);

				await expect(
					controller.login(
						{
							correo: 'ana@bioactiva.com',
							password: 'wrong-password',
						},
						responseMock,
					),
				).rejects.toThrow(UnauthorizedException);
			});

			it('should throw UnauthorizedException when user is not authorized', async () => {
				authenticateUserUseCase.execute.mockRejectedValue(
					new NotAuthorizedException(''),
				);

				await expect(
					controller.login(
						{ correo: 'ana@bioactiva.com', password: 'password' },
						responseMock,
					),
				).rejects.toThrow(UnauthorizedException);
			});

			it('should rethrow unexpected errors', async () => {
				const unexpectedError = new Error('Unexpected error');
				authenticateUserUseCase.execute.mockRejectedValue(unexpectedError);

				await expect(
					controller.login(
						{ correo: 'ana@bioactiva.com', password: 'password' },
						responseMock,
					),
				).rejects.toThrow('Unexpected error');
			});
		});

		describe('refresh endpoint', () => {
			it('should return new access token and refresh token when refresh token is valid', async () => {
				const tokenPair = buildTokenPair();
				refreshSessionUseCase.execute.mockResolvedValue(tokenPair);

				const result = await controller.refresh(
					responseMock,
					'valid-refresh-token',
				);

				expect(result).toEqual({
					accessToken: 'access-token-value',
					accessTokenExpiresIn: 900,
				});
				expect(refreshSessionUseCase.execute).toHaveBeenCalledWith(
					'valid-refresh-token',
				);
				expect(responseMock.cookie).toHaveBeenCalledWith(
					'refreshToken',
					'refresh-token-value',
					expect.objectContaining({
						httpOnly: true,
					}),
				);
			});

			it('should throw UnauthorizedException when refresh token is missing', async () => {
				await expect(
					controller.refresh(responseMock, null),
				).rejects.toThrow(UnauthorizedException);
				expect(refreshSessionUseCase.execute).not.toHaveBeenCalled();
			});

			it('should throw UnauthorizedException when refresh token is invalid', async () => {
				refreshSessionUseCase.execute.mockRejectedValue(
					new NotAuthorizedException(''),
				);

				await expect(
					controller.refresh(responseMock, 'invalid-refresh-token'),
				).rejects.toThrow(UnauthorizedException);
			});

			it('should set secure cookie flag in production environment', async () => {
				process.env.NODE_ENV = 'production';
				const tokenPair = buildTokenPair();
				refreshSessionUseCase.execute.mockResolvedValue(tokenPair);

				await controller.refresh(responseMock, 'valid-refresh-token');

				expect(responseMock.cookie).toHaveBeenCalledWith(
					'refreshToken',
					'refresh-token-value',
					expect.objectContaining({
						secure: true,
						httpOnly: true,
					}),
				);

				delete process.env.NODE_ENV;
			});
		});

		describe('me endpoint', () => {
			it('should return the authenticated user', () => {
				const user = buildUser();

				const result = controller.me(user);

				expect(result).toEqual(user);
				expect(result.correo).toBe('ana@bioactiva.com');
				expect(result.estado).toBe(UserState.ACTIVO);
			});
		});
	});
});
