import { describe, expect, it, jest } from '@jest/globals';

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

import { BcryptPasswordHasher } from '@/modules/auth/infrastructure/hash/bcrypt-password-hasher';

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
        it('should hash and compare passwords with bcrypt', async () => {
            process.env.BCRYPT_SALT_ROUNDS = '4';
            const hasher = new BcryptPasswordHasher();
            const bcrypt = jest.requireMock('bcryptjs');

            bcrypt.hash.mockResolvedValue('hashed-password');
            bcrypt.compare.mockResolvedValueOnce(true);
            bcrypt.compare.mockResolvedValueOnce(false);

            const hashedPassword = await hasher.hash('secret-password');

            expect(hashedPassword).toBe('hashed-password');
            expect(bcrypt.hash).toHaveBeenCalledWith('secret-password', 4);

            await expect(
                hasher.compare('secret-password', hashedPassword),
            ).resolves.toBe(true);
            await expect(
                hasher.compare('wrong-password', hashedPassword),
            ).resolves.toBe(false);
        });

        it('should use default salt rounds when env not set', async () => {
            const originalSalt = process.env.BCRYPT_SALT_ROUNDS;
            delete process.env.BCRYPT_SALT_ROUNDS;

            const hasher = new BcryptPasswordHasher();
            const bcrypt = jest.requireMock('bcryptjs');
            bcrypt.hash.mockResolvedValue('hashed-password');

            await hasher.hash('secret-password');
            expect(bcrypt.hash).toHaveBeenCalledWith('secret-password', 10);

            if (originalSalt) {
                process.env.BCRYPT_SALT_ROUNDS = originalSalt;
            }
        });
    });
});
