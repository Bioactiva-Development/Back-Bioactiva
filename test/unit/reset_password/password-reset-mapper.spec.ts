import { describe, expect, it } from '@jest/globals';
import { PasswordResetMapper } from '@/modules/reset_password/infrastructure/mapper/password-reset.mapper';

describe('PasswordResetMapper', () => {
    const validRecord = {
        id: 1,
        idUsuario: 1,
        tokenHash: 'hash-abc',
        estado: 'PENDIENTE' as any,
        proposito: 'RESET_PASSWORD' as any,
        createdAt: new Date(),
        consumedAt: null,
        expiresAt: new Date(),
        correo: 'user@test.com',
    };

    it('should map valid record to domain', () => {
        const result = PasswordResetMapper.toDomain(validRecord as any);
        expect(result).toBeDefined();
        expect(result.user_id).toBe(1);
    });

    it('should throw when proposito is not RESET_PASSWORD', () => {
        const invalidRecord = { ...validRecord, proposito: 'INVITATION' as any };
        expect(() => PasswordResetMapper.toDomain(invalidRecord as any)).toThrow(
            'El token no es de restablecimiento de contraseña',
        );
    });

    it('should throw when idUsuario is null', () => {
        const invalidRecord = { ...validRecord, idUsuario: null };
        expect(() => PasswordResetMapper.toDomain(invalidRecord as any)).toThrow(
            'El token de restablecimiento debe tener un ID de usuario asociado',
        );
    });
});
