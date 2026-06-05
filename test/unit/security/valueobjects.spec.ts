import { describe, expect, it } from '@jest/globals';

import { LoginCredentials } from '@/modules/auth/domain/value-objects/login_credentials';
import { TokenPair } from '@/modules/auth/domain/value-objects/token_pair';

describe('Security module', () => {
    /**
     * Value Objects
     * ----------
     * Responsable de:
     * - validación de credenciales de login
     * - validación de pares de token
     * - integridad de datos de autenticación
     */
    // STATUS: Implementación completa (validaciones de value objects core).
    describe('Auth value objects', () => {
        describe('LoginCredentials', () => {
            it('should create valid login credentials', () => {
                const credentials = new LoginCredentials(
                    'ana@bioactiva.com',
                    'password123',
                );

                expect(credentials.correo).toBe('ana@bioactiva.com');
                expect(credentials.password).toBe('password123');
            });

            it('should accept credentials with empty strings (frontend validation)', () => {
                const credentials = new LoginCredentials('', '');

                expect(credentials.correo).toBe('');
                expect(credentials.password).toBe('');
                // Validación real ocurre en use-case / DTO guard, no en value object
            });

            it('should create credentials with special characters', () => {
                const credentials = new LoginCredentials(
                    'test+tag@example.com',
                    'p@$$w0rd!',
                );

                expect(credentials.correo).toBe('test+tag@example.com');
                expect(credentials.password).toBe('p@$$w0rd!');
            });
        });

        describe('TokenPair', () => {
            it('should create token pair with valid tokens and expiration times', () => {
                const tokenPair = new TokenPair(
                    'access-token-value',
                    'refresh-token-value',
                    900, // 15 min
                    604800, // 7 days
                );

                expect(tokenPair.accessToken).toBe('access-token-value');
                expect(tokenPair.refreshToken).toBe('refresh-token-value');
                expect(tokenPair.accessTokenExpiresIn).toBe(900);
                expect(tokenPair.refreshTokenExpiresIn).toBe(604800);
            });

            it('should maintain properties through constructor', () => {
                const tokenPair = new TokenPair(
                    'access-token',
                    'refresh-token',
                    900,
                    604800,
                );

                // Validar que todos los valores se asignaron correctamente en el constructor
                expect(tokenPair.accessToken).toBe('access-token');
                expect(tokenPair.refreshToken).toBe('refresh-token');
                expect(tokenPair.accessTokenExpiresIn).toBe(900);
                expect(tokenPair.refreshTokenExpiresIn).toBe(604800);
            });

            it('should accept zero or minimal expiration times', () => {
                const tokenPair = new TokenPair(
                    'access-token',
                    'refresh-token',
                    0,
                    0,
                );

                expect(tokenPair.accessTokenExpiresIn).toBe(0);
                expect(tokenPair.refreshTokenExpiresIn).toBe(0);
                // Edge case: expiraciones inmediatas son técnicamente válidas
            });

            it('should accept large expiration times', () => {
                const largeExpiration = 31536000; // 1 year in seconds

                const tokenPair = new TokenPair(
                    'access-token',
                    'refresh-token',
                    largeExpiration,
                    largeExpiration * 2,
                );

                expect(tokenPair.accessTokenExpiresIn).toBe(largeExpiration);
                expect(tokenPair.refreshTokenExpiresIn).toBe(
                    largeExpiration * 2,
                );
            });
        });
    });
});
