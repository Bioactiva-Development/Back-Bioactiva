import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { InvitationEmailPublisher } from '@/modules/invitations/infrastructure/queue/invitation-email.publisher';
import { InvitationExpirationPublisher } from '@/modules/invitations/infrastructure/queue/invitation-expiration.publisher';
import { UserRole } from '@/shared/domain/enums/rol';

describe('Invitation Publishers', () => {
    let mockQueue: any;

    beforeEach(() => {
        mockQueue = {
            add: jest.fn(),
        };
    });

    describe('InvitationEmailPublisher', () => {
        it('should enqueue invitation email', async () => {
            const publisher = new InvitationEmailPublisher(mockQueue as any);
            mockQueue.add.mockResolvedValue(undefined);

            await publisher.enqueueInvitationEmail({
                correo: 'user@test.com',
                token: 'token-abc',
                rol: UserRole.TRABAJADOR,
                invitedBy: 1,
            });

            expect(mockQueue.add).toHaveBeenCalledWith(
                'send-invitation-email',
                {
                    correo: 'user@test.com',
                    token: 'token-abc',
                    rol: UserRole.TRABAJADOR,
                    invitedBy: 1,
                },
                expect.objectContaining({
                    attempts: 3,
                }),
            );
        });
    });

    describe('InvitationExpirationPublisher', () => {
        it('should schedule expiration with correct delay', async () => {
            const publisher = new InvitationExpirationPublisher(mockQueue as any);
            mockQueue.add.mockResolvedValue(undefined);

            const futureDate = new Date(Date.now() + 3600000);
            await publisher.scheduleExpiration({
                invitationId: 1,
                expiresAt: futureDate,
            });

            expect(mockQueue.add).toHaveBeenCalledWith(
                'expire-invitation',
                { invitationId: 1 },
                expect.objectContaining({
                    jobId: 'expire-invitation-1',
                    attempts: 1,
                }),
            );
        });

        it('should schedule expiration with zero delay when already expired', async () => {
            const publisher = new InvitationExpirationPublisher(mockQueue as any);
            mockQueue.add.mockResolvedValue(undefined);

            const pastDate = new Date(Date.now() - 3600000);
            await publisher.scheduleExpiration({
                invitationId: 2,
                expiresAt: pastDate,
            });

            expect(mockQueue.add).toHaveBeenCalled();
        });
    });
});
