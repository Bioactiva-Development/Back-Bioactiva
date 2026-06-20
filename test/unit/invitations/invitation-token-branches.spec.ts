import { describe, expect, it } from '@jest/globals';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { UserRole } from '@/shared/domain/enums/rol';
import { InvitationAlreadyAcceptedException } from '@/modules/invitations/domain/exceptions/invitation-already-accepted.exception';
import { InvitationRevokedException } from '@/modules/invitations/domain/exceptions/invitation-revoked.exception';

describe('Invitations module', () => {
    describe('InvitationToken entity — non-pending, non-expired branches', () => {
        const correo = 'nuevousuario@bioactiva.com';
        const token = 'hashed-token-123';
        const rol = UserRole.TRABAJADOR;
        const createdAt = new Date();
        // expiry in the future so isExpired() is false and the status guard runs.
        const futureExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const consumed = () =>
            new InvitationToken(
                1,
                correo,
                token,
                rol,
                1,
                TokenStatus.CONSUMIDO,
                createdAt,
                new Date(),
                futureExpiry,
            );

        it('accept on a consumed (not expired) token throws AlreadyAccepted', () => {
            expect(() => consumed().accept()).toThrow(
                InvitationAlreadyAcceptedException,
            );
        });

        it('revoke on a consumed (not expired) token throws Revoked', () => {
            expect(() => consumed().revoke()).toThrow(
                InvitationRevokedException,
            );
        });
    });
});
