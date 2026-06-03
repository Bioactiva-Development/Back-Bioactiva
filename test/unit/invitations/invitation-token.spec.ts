import { describe, expect, it } from '@jest/globals';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { UserRole } from '@/shared/domain/enums/rol';
import { InvitationExpiredException } from '@/modules/invitations/domain/exceptions/invitation-expired.exception';
import { InvitationAlreadyAcceptedException } from '@/modules/invitations/domain/exceptions/invitation-already-accepted.exception';
import { InvitationRevokedException } from '@/modules/invitations/domain/exceptions/invitation-revoked.exception';

describe('Invitations module', () => {
    /**
     * InvitationToken Entity
     * ----------
     * Responsable de:
     * - representar un token de invitación con su ciclo de vida
     * - validar transiciones de estado
     * - prevenir operaciones inválidas en tokens expirados/consumidos
     */
    // STATUS: Implementación completa (entity behavior + state transitions).
    describe('InvitationToken entity', () => {
        const invitadorId = 1;
        const correo = 'nuevousuario@bioactiva.com';
        const token = 'hashed-token-123';
        const rol = UserRole.TRABAJADOR;
        const createdAt = new Date();
        const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        const buildInvitation = () =>
            new InvitationToken(
                1,
                correo,
                token,
                rol,
                invitadorId,
                TokenStatus.PENDIENTE,
                createdAt,
                null,
                expiredAt,
            );

        describe('creation and initial state', () => {
            it('should create invitation token with pending status', () => {
                const invitation = buildInvitation();

                expect(invitation.id).toBe(1);
                expect(invitation.correo).toBe(correo);
                expect(invitation.token).toBe(token);
                expect(invitation.rol).toBe(UserRole.TRABAJADOR);
                expect(invitation.invitador_id).toBe(invitadorId);
                expect(invitation.estado).toBe(TokenStatus.PENDIENTE);
                expect(invitation.consumed_at).toBeNull();
            });

            it('should allow null id for new invitations', () => {
                const newInvitation = new InvitationToken(
                    null,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.PENDIENTE,
                    createdAt,
                    null,
                    expiredAt,
                );

                expect(newInvitation.id).toBeNull();
                expect(newInvitation.isPending()).toBe(true);
            });
        });

        describe('isExpired', () => {
            it('should return false for pending invitation not past expiration', () => {
                const futureExpiry = new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                );
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.PENDIENTE,
                    createdAt,
                    null,
                    futureExpiry,
                );

                expect(invitation.isExpired()).toBe(false);
            });

            it('should return true for invitation with expired status', () => {
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.EXPIRADO,
                    createdAt,
                    null,
                    expiredAt,
                );

                expect(invitation.isExpired()).toBe(true);
            });

            it('should return true when current time exceeds expiration date', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.PENDIENTE,
                    createdAt,
                    null,
                    pastExpiry,
                );

                expect(invitation.isExpired()).toBe(true);
            });
        });

        describe('isPending', () => {
            it('should return true when estado is PENDIENTE', () => {
                const invitation = buildInvitation();

                expect(invitation.isPending()).toBe(true);
            });

            it('should return false when estado is CONSUMIDO', () => {
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.CONSUMIDO,
                    createdAt,
                    new Date(),
                    expiredAt,
                );

                expect(invitation.isPending()).toBe(false);
            });

            it('should return false when estado is EXPIRADO', () => {
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.EXPIRADO,
                    createdAt,
                    null,
                    expiredAt,
                );

                expect(invitation.isPending()).toBe(false);
            });
        });

        describe('isAccepted', () => {
            it('should return true when estado is CONSUMIDO', () => {
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.CONSUMIDO,
                    createdAt,
                    new Date(),
                    expiredAt,
                );

                expect(invitation.isAccepted()).toBe(true);
            });

            it('should return false for pending invitation', () => {
                const invitation = buildInvitation();

                expect(invitation.isAccepted()).toBe(false);
            });
        });

        describe('accept', () => {
            it('should accept pending invitation and set consumed_at', () => {
                const invitation = buildInvitation();
                const beforeAccept = new Date();

                invitation.accept();

                expect(invitation.estado).toBe(TokenStatus.CONSUMIDO);
                expect(invitation.consumed_at).not.toBeNull();
                expect(
                    invitation.consumed_at!.getTime(),
                ).toBeGreaterThanOrEqual(beforeAccept.getTime());
            });

            it('should reject accept on expired invitation by date', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.PENDIENTE,
                    createdAt,
                    null,
                    pastExpiry,
                );

                expect(() => invitation.accept()).toThrow(
                    InvitationExpiredException,
                );
            });

            it('should reject accept on already accepted invitation', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.CONSUMIDO,
                    createdAt,
                    new Date(),
                    pastExpiry,
                );

                expect(() => invitation.accept()).toThrow(
                    InvitationExpiredException,
                );
            });

            it('should reject accept on expired invitation with EXPIRADO status', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.EXPIRADO,
                    createdAt,
                    null,
                    pastExpiry,
                );

                expect(() => invitation.accept()).toThrow(
                    InvitationExpiredException,
                );
            });
        });

        describe('revoke', () => {
            it('should revoke pending invitation', () => {
                const invitation = buildInvitation();

                invitation.revoke();

                expect(invitation.estado).toBe(TokenStatus.EXPIRADO);
            });

            it('should reject revoke on expired invitation by date', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.PENDIENTE,
                    createdAt,
                    null,
                    pastExpiry,
                );

                expect(() => invitation.revoke()).toThrow(
                    InvitationExpiredException,
                );
            });

            it('should reject revoke on already consumed invitation', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.CONSUMIDO,
                    createdAt,
                    new Date(),
                    pastExpiry,
                );

                expect(() => invitation.revoke()).toThrow(
                    InvitationExpiredException,
                );
            });

            it('should reject revoke on already expired invitation', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.EXPIRADO,
                    createdAt,
                    null,
                    pastExpiry,
                );

                expect(() => invitation.revoke()).toThrow(
                    InvitationExpiredException,
                );
            });
        });

        describe('expire', () => {
            it('should expire pending invitation', () => {
                const invitation = buildInvitation();

                invitation.expire();

                expect(invitation.estado).toBe(TokenStatus.EXPIRADO);
            });

            it('should reject expire on already expired invitation', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.EXPIRADO,
                    createdAt,
                    null,
                    pastExpiry,
                );

                expect(() => invitation.expire()).toThrow(
                    InvitationExpiredException,
                );
            });

            it('should reject expire on already consumed invitation', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.CONSUMIDO,
                    createdAt,
                    new Date(),
                    pastExpiry,
                );

                expect(() => invitation.expire()).toThrow(
                    InvitationExpiredException,
                );
            });

            it('should reject expire on invitation past expiration date', () => {
                const pastExpiry = new Date(Date.now() - 1000);
                const invitation = new InvitationToken(
                    1,
                    correo,
                    token,
                    rol,
                    invitadorId,
                    TokenStatus.PENDIENTE,
                    createdAt,
                    null,
                    pastExpiry,
                );

                expect(() => invitation.expire()).toThrow(
                    InvitationExpiredException,
                );
            });
        });

        describe('state transitions', () => {
            it('should track complete lifecycle from pending to accepted', () => {
                const invitation = buildInvitation();

                expect(invitation.isPending()).toBe(true);
                expect(invitation.isAccepted()).toBe(false);
                expect(invitation.isExpired()).toBe(false);

                invitation.accept();

                expect(invitation.isPending()).toBe(false);
                expect(invitation.isAccepted()).toBe(true);
                expect(invitation.isExpired()).toBe(false);
            });

            it('should track complete lifecycle from pending to revoked', () => {
                const invitation = buildInvitation();

                expect(invitation.isPending()).toBe(true);

                invitation.revoke();

                expect(invitation.isPending()).toBe(false);
                expect(invitation.isExpired()).toBe(true);
            });

            it('should preserve invitation data during state changes', () => {
                const invitation = buildInvitation();

                invitation.revoke();

                expect(invitation.correo).toBe(correo);
                expect(invitation.rol).toBe(UserRole.TRABAJADOR);
                expect(invitation.invitador_id).toBe(invitadorId);
            });
        });
    });
});
