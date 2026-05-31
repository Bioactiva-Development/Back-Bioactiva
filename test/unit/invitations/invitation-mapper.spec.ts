import { describe, expect, it } from '@jest/globals';
import { InvitationMapper } from '@/modules/invitations/infrastructure/mapper/invitation.mapper';

describe('InvitationMapper', () => {
    const validRecord = {
        id: 1,
        correo: 'user@test.com',
        tokenHash: 'hash-abc',
        rol: 'TRABAJADOR' as any,
        invitadorId: 1,
        estado: 'PENDIENTE' as any,
        proposito: 'INVITACION' as any,
        createdAt: new Date(),
        consumedAt: null,
        expiresAt: new Date(),
    };

    describe('toDomain', () => {
        it('should map valid record to InvitationToken', () => {
            const result = InvitationMapper.toDomain(validRecord as any);
            expect(result).toBeDefined();
            expect(result.correo).toBe('user@test.com');
        });

        it('should throw when proposito is not INVITACION', () => {
            const invalid = { ...validRecord, proposito: 'RESET_PASSWORD' as any };
            expect(() => InvitationMapper.toDomain(invalid as any)).toThrow(
                'El token no es una invitación',
            );
        });

        it('should throw when rol is missing', () => {
            const invalid = { ...validRecord, rol: null };
            expect(() => InvitationMapper.toDomain(invalid as any)).toThrow(
                'El token de invitación debe tener un rol asociado',
            );
        });

        it('should throw when invitadorId is missing', () => {
            const invalid = { ...validRecord, invitadorId: null };
            expect(() => InvitationMapper.toDomain(invalid as any)).toThrow(
                'El token de invitación debe tener un ID de invitador asociado',
            );
        });
    });

    describe('toPersistence', () => {
        it('should create Prisma input from InvitationToken', () => {
            const token = InvitationMapper.toDomain(validRecord as any);
            const result = InvitationMapper.toPersistence(token);
            expect(result.correo).toBe('user@test.com');
            expect(result.tokenHash).toBe('hash-abc');
            expect(result.proposito).toBe('INVITACION');
            expect(result.rol).toBe('TRABAJADOR');
        });
    });
});
