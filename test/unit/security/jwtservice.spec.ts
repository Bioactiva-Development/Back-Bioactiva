import { describe, expect, it, jest, afterEach } from '@jest/globals';

jest.mock(
	'@nestjs/jwt',
	() => ({
		__esModule: true,
		JwtService: class JwtService {},
	}),
	{ virtual: true },
);

import { JwtTokenService } from '@/modules/auth/infrastructure/jwt/jwt-token.service';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '@/shared/enums/rol';

describe('Security module', () => {
	/**
	 * PasswordHasher y JwtTokenService
	 * ----------
	 * Responsable de:
	 * - hash y comparación de contraseñas
	 * - firma y verificación de access token
	 * - firma y verificación de refresh token
	 */
	// STATUS: Implementación parcial (bcrypt, JWT, claims y variables de entorno críticas).
	describe('Password hashing and JWT services', () => {
		const originalEnv = {
			JWT_SECRET: process.env.JWT_SECRET,
			JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
			JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
			JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
			JWT_ISSUER: process.env.JWT_ISSUER,
			JWT_AUDIENCE: process.env.JWT_AUDIENCE,
		};

		afterEach(() => {
			process.env.JWT_SECRET = originalEnv.JWT_SECRET;
			process.env.JWT_EXPIRES_IN = originalEnv.JWT_EXPIRES_IN;
			process.env.JWT_REFRESH_SECRET = originalEnv.JWT_REFRESH_SECRET;
			process.env.JWT_REFRESH_EXPIRES_IN = originalEnv.JWT_REFRESH_EXPIRES_IN;
			process.env.JWT_ISSUER = originalEnv.JWT_ISSUER;
			process.env.JWT_AUDIENCE = originalEnv.JWT_AUDIENCE;
		});

		it('should sign and verify JWT payloads using the configured secrets', () => {
			process.env.JWT_SECRET = 'jwt-secret';
			process.env.JWT_EXPIRES_IN = '900s';
			process.env.JWT_REFRESH_SECRET = 'jwt-refresh-secret';
			process.env.JWT_REFRESH_EXPIRES_IN = '604800s';
			process.env.JWT_ISSUER = 'bioactiva';
			process.env.JWT_AUDIENCE = 'bioactiva-clients';

			const jwtService = {
				sign: jest.fn().mockReturnValue('signed-token'),
				verify: jest.fn().mockReturnValue({ sub: '1' }),
			};
			const service = new JwtTokenService(jwtService as never);

			expect(
				service.signAccessToken({
					sub: '1',
					correo: 'ana@bioactiva.com',
					nombres: 'Ana',
					apellidos: 'Paredes',
					role: UserRole.TRABAJADOR,
					estado: UserState.ACTIVO,
				}),
			).toBe('signed-token');
			expect(jwtService.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					sub: '1',
					correo: 'ana@bioactiva.com',
				}),
				expect.objectContaining({
					secret: 'jwt-secret',
					expiresIn: '900s',
					issuer: 'bioactiva',
					audience: 'bioactiva-clients',
				}),
			);

			expect(service.verifyAccessToken('access-token')).toEqual({ sub: '1' });
			expect(jwtService.verify).toHaveBeenCalledWith(
				'access-token',
				expect.objectContaining({
					secret: 'jwt-secret',
					issuer: 'bioactiva',
					audience: 'bioactiva-clients',
				}),
			);

			expect(
				service.signRefreshToken({
					sub: '1',
					tokenVersion: 3,
				}),
			).toBe('signed-token');
			expect(jwtService.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					sub: '1',
					tokenVersion: 3,
				}),
				expect.objectContaining({
					secret: 'jwt-refresh-secret',
					expiresIn: '604800s',
					issuer: 'bioactiva',
					audience: 'bioactiva-clients',
				}),
			);
		});

		it('should throw when JWT secrets are missing', () => {
			delete process.env.JWT_SECRET;
			delete process.env.JWT_ISSUER;
			delete process.env.JWT_AUDIENCE;

			const jwtService = {
				sign: jest.fn(),
				verify: jest.fn(),
			};
			const service = new JwtTokenService(jwtService as never);

			expect(() =>
				service.signAccessToken({
					sub: '1',
					correo: 'ana@bioactiva.com',
					nombres: 'Ana',
					apellidos: 'Paredes',
					role: UserRole.TRABAJADOR,
					estado: UserState.ACTIVO,
				}),
			).toThrow('Falta la variable de entorno JWT_SECRET');
		});
	});
});
