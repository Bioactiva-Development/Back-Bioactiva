import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from '@/modules/auth/infrastructure/jwt/jwt-token.service';
import { JwtClaims, RefreshJwtClaims } from '@/modules/auth/domain/value-objects/jwt_claims';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Security module', () => {
	/**
	 * JwtTokenService
	 * ----------
	 * Responsable de:
	 * - firmar tokens de acceso con claims del usuario
	 * - verificar tokens de acceso
	 * - firmar tokens de refresco con claims mínimos
	 * - verificar tokens de refresco
	 * - validar variables de entorno requeridas
	 */
	// STATUS: Implementación completa (token lifecycle management).
	describe('JwtTokenService', () => {
		let service: JwtTokenService;
		let jwtServiceMock: jest.Mocked<JwtService>;

		const accessTokenClaims: JwtClaims = {
			sub: '1',
			correo: 'user@bioactiva.com',
			nombres: 'John',
			apellidos: 'Doe',
			role: UserRole.TRABAJADOR,
			estado: UserState.ACTIVO,
			tokenVersion: 1,
		};

		const refreshTokenClaims: RefreshJwtClaims = {
			sub: '1',
			tokenVersion: 1,
		};

		beforeEach(() => {
			// Set required environment variables
			process.env.JWT_SECRET = 'test-secret-key';
			process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
			process.env.JWT_EXPIRES_IN = '900';
			process.env.JWT_REFRESH_EXPIRES_IN = '604800';
			process.env.JWT_ISSUER = 'bioactiva';
			process.env.JWT_AUDIENCE = 'bioactiva-users';

			jwtServiceMock = {
				sign: jest.fn().mockReturnValue('signed-token'),
				verify: jest.fn().mockReturnValue(accessTokenClaims),
			} as unknown as jest.Mocked<JwtService>;

			service = new JwtTokenService(jwtServiceMock);
		});

		describe('signAccessToken', () => {
			it('should sign access token with claims', () => {
				const token = service.signAccessToken(accessTokenClaims);

				expect(token).toBe('signed-token');
				expect(jwtServiceMock.sign).toHaveBeenCalledWith(
					accessTokenClaims,
					expect.objectContaining({
						secret: 'test-secret-key',
						issuer: 'bioactiva',
						audience: 'bioactiva-users',
					}),
				);
			});

			it('should include user claims in access token', () => {
				service.signAccessToken(accessTokenClaims);

				const callArgs = (jwtServiceMock.sign as jest.Mock).mock.calls[0];
				const payload = callArgs[0];

				expect(payload.sub).toBe('1');
				expect(payload.correo).toBe('user@bioactiva.com');
				expect(payload.nombres).toBe('John');
				expect(payload.apellidos).toBe('Doe');
				expect(payload.role).toBe(UserRole.TRABAJADOR);
				expect(payload.estado).toBe(UserState.ACTIVO);
			});

			it('should throw if JWT_SECRET not configured', () => {
				delete process.env.JWT_SECRET;

				expect(() => service.signAccessToken(accessTokenClaims)).toThrow(
					'Falta la variable de entorno JWT_SECRET',
				);
			});

			it('should throw if JWT_ISSUER not configured', () => {
				delete process.env.JWT_ISSUER;

				expect(() => service.signAccessToken(accessTokenClaims)).toThrow(
					'Falta la variable de entorno JWT_ISSUER',
				);
			});

			it('should throw if JWT_AUDIENCE not configured', () => {
				delete process.env.JWT_AUDIENCE;

				expect(() => service.signAccessToken(accessTokenClaims)).toThrow(
					'Falta la variable de entorno JWT_AUDIENCE',
				);
			});

			it('should throw if JWT_EXPIRES_IN not configured', () => {
				delete process.env.JWT_EXPIRES_IN;

				expect(() => service.signAccessToken(accessTokenClaims)).toThrow(
					'Falta la variable de entorno JWT_EXPIRES_IN',
				);
			});

			it('should handle claims with optional tokenVersion', () => {
				const claimsWithoutVersion = {
					...accessTokenClaims,
					tokenVersion: undefined,
				};

				service.signAccessToken(claimsWithoutVersion);

				const callArgs = (jwtServiceMock.sign as jest.Mock).mock.calls[0];
				const payload = callArgs[0];

				expect(payload.tokenVersion).toBeUndefined();
			});
		});

		describe('verifyAccessToken', () => {
			it('should verify valid access token', () => {
				const token = 'valid-access-token';
				jwtServiceMock.verify.mockReturnValue(accessTokenClaims);

				const result = service.verifyAccessToken(token);

				expect(result).toEqual(accessTokenClaims);
				expect(jwtServiceMock.verify).toHaveBeenCalledWith(
					token,
					expect.objectContaining({
						secret: 'test-secret-key',
						issuer: 'bioactiva',
						audience: 'bioactiva-users',
					}),
				);
			});

			it('should throw for invalid token signature', () => {
				const token = 'invalid-token';
				const error = new Error('Invalid signature');
				jwtServiceMock.verify.mockImplementation(() => {
					throw error;
				});

				expect(() => service.verifyAccessToken(token)).toThrow(
					'Invalid signature',
				);
			});

			it('should throw for expired token', () => {
				const token = 'expired-token';
				const error = new Error('Token expired');
				jwtServiceMock.verify.mockImplementation(() => {
					throw error;
				});

				expect(() => service.verifyAccessToken(token)).toThrow(
					'Token expired',
				);
			});

			it('should throw if JWT_SECRET not configured', () => {
				delete process.env.JWT_SECRET;

				expect(() => service.verifyAccessToken('token')).toThrow(
					'Falta la variable de entorno JWT_SECRET',
				);
			});

			it('should return verified claims with tokenVersion', () => {
				const token = 'token-with-version';
				jwtServiceMock.verify.mockReturnValue(accessTokenClaims);

				const result = service.verifyAccessToken(token);

				expect(result.tokenVersion).toBe(1);
			});
		});

		describe('signRefreshToken', () => {
			it('should sign refresh token with minimal claims', () => {
				const token = service.signRefreshToken(refreshTokenClaims);

				expect(token).toBe('signed-token');
				expect(jwtServiceMock.sign).toHaveBeenCalledWith(
					refreshTokenClaims,
					expect.objectContaining({
						secret: 'test-refresh-secret-key',
						issuer: 'bioactiva',
						audience: 'bioactiva-users',
					}),
				);
			});

			it('should use refresh token secret', () => {
				service.signRefreshToken(refreshTokenClaims);

				const callArgs = (jwtServiceMock.sign as jest.Mock).mock.calls[0];
				const options = callArgs[1];

				expect(options.secret).toBe('test-refresh-secret-key');
			});

			it('should throw if JWT_REFRESH_SECRET not configured', () => {
				delete process.env.JWT_REFRESH_SECRET;

				expect(() => service.signRefreshToken(refreshTokenClaims)).toThrow(
					'Falta la variable de entorno JWT_REFRESH_SECRET',
				);
			});

			it('should throw if JWT_REFRESH_EXPIRES_IN not configured', () => {
				delete process.env.JWT_REFRESH_EXPIRES_IN;

				expect(() => service.signRefreshToken(refreshTokenClaims)).toThrow(
					'Falta la variable de entorno JWT_REFRESH_EXPIRES_IN',
				);
			});

			it('should only include sub and tokenVersion in refresh token', () => {
				service.signRefreshToken(refreshTokenClaims);

				const callArgs = (jwtServiceMock.sign as jest.Mock).mock.calls[0];
				const payload = callArgs[0];

				expect(Object.keys(payload).sort()).toEqual(['sub', 'tokenVersion']);
				expect(payload.sub).toBe('1');
				expect(payload.tokenVersion).toBe(1);
			});
		});

		describe('verifyRefreshToken', () => {
			it('should verify valid refresh token', () => {
				const token = 'valid-refresh-token';
				jwtServiceMock.verify.mockReturnValue(refreshTokenClaims);

				const result = service.verifyRefreshToken(token);

				expect(result).toEqual(refreshTokenClaims);
				expect(jwtServiceMock.verify).toHaveBeenCalledWith(
					token,
					expect.objectContaining({
						secret: 'test-refresh-secret-key',
						issuer: 'bioactiva',
						audience: 'bioactiva-users',
					}),
				);
			});

			it('should throw for invalid refresh token', () => {
				const token = 'invalid-refresh-token';
				const error = new Error('Invalid token');
				jwtServiceMock.verify.mockImplementation(() => {
					throw error;
				});

				expect(() => service.verifyRefreshToken(token)).toThrow(
					'Invalid token',
				);
			});

			it('should throw if JWT_REFRESH_SECRET not configured', () => {
				delete process.env.JWT_REFRESH_SECRET;

				expect(() => service.verifyRefreshToken('token')).toThrow(
					'Falta la variable de entorno JWT_REFRESH_SECRET',
				);
			});

			it('should return tokenVersion from refresh token', () => {
				const token = 'refresh-token-with-version';
				jwtServiceMock.verify.mockReturnValue(refreshTokenClaims);

				const result = service.verifyRefreshToken(token);

				expect(result.tokenVersion).toBe(1);
			});
		});

		describe('token lifecycle', () => {
			it('should handle complete authentication cycle', () => {
				// Sign access token
				jwtServiceMock.sign.mockReturnValueOnce('access-token-123');
				const accessToken = service.signAccessToken(accessTokenClaims);

				// Sign refresh token
				jwtServiceMock.sign.mockReturnValueOnce('refresh-token-456');
				const refreshToken = service.signRefreshToken(refreshTokenClaims);

				expect(accessToken).toBe('access-token-123');
				expect(refreshToken).toBe('refresh-token-456');
				expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
			});

			it('should use different secrets for access and refresh tokens', () => {
				service.signAccessToken(accessTokenClaims);
				const accessCallSecret = (jwtServiceMock.sign as jest.Mock).mock
					.calls[0][1].secret;

				jwtServiceMock.sign.mockClear();

				service.signRefreshToken(refreshTokenClaims);
				const refreshCallSecret = (jwtServiceMock.sign as jest.Mock).mock
					.calls[0][1].secret;

				expect(accessCallSecret).toBe('test-secret-key');
				expect(refreshCallSecret).toBe('test-refresh-secret-key');
				expect(accessCallSecret).not.toBe(refreshCallSecret);
			});
		});

		describe('environment variable requirements', () => {
			it('should require all JWT environment variables for access token', () => {
				const requiredVars = [
					'JWT_SECRET',
					'JWT_EXPIRES_IN',
					'JWT_ISSUER',
					'JWT_AUDIENCE',
				];

				requiredVars.forEach((varName) => {
					process.env.JWT_SECRET = 'test-secret-key';
					process.env.JWT_EXPIRES_IN = '900';
					process.env.JWT_ISSUER = 'bioactiva';
					process.env.JWT_AUDIENCE = 'bioactiva-users';

					delete process.env[varName];

					expect(() =>
						service.signAccessToken(accessTokenClaims),
					).toThrow(`Falta la variable de entorno ${varName}`);
				});
			});

			it('should require all JWT environment variables for refresh token', () => {
				const requiredVars = [
					'JWT_REFRESH_SECRET',
					'JWT_REFRESH_EXPIRES_IN',
					'JWT_ISSUER',
					'JWT_AUDIENCE',
				];

				requiredVars.forEach((varName) => {
					process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
					process.env.JWT_REFRESH_EXPIRES_IN = '604800';
					process.env.JWT_ISSUER = 'bioactiva';
					process.env.JWT_AUDIENCE = 'bioactiva-users';

					delete process.env[varName];

					expect(() =>
						service.signRefreshToken(refreshTokenClaims),
					).toThrow(`Falta la variable de entorno ${varName}`);
				});
			});
		});
	});
});
