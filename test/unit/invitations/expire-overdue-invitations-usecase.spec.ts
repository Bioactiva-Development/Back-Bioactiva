import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ExpireOverdueInvitationsUseCase } from '@/modules/invitations/application/use-cases/expire-overdue-invitations.use-case';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { UserRole } from '@/shared/domain/enums/rol';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

describe('Invitations module', () => {
    describe('ExpireOverdueInvitationsUseCase', () => {
        let useCase: ExpireOverdueInvitationsUseCase;
        let mockRepository: any;
        let deactivateInvitedUser: any;

        beforeEach(() => {
            mockRepository = {
                findPendingExpired: jest.fn(),
                expireAllPending: jest.fn(),
            };
            deactivateInvitedUser = {
                executeMany: jest.fn(() => Promise.resolve()),
            };
            useCase = new ExpireOverdueInvitationsUseCase(
                mockRepository,
                deactivateInvitedUser,
            );
        });

        it('should expire overdue invitations and return count', async () => {
            const inv1 = new InvitationToken(
                1,
                'user1@test.com',
                'token1',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 3600000),
            );
            const inv2 = new InvitationToken(
                2,
                'user2@test.com',
                'token2',
                UserRole.TRABAJADOR,
                1,
                TokenStatus.PENDIENTE,
                new Date(),
                null,
                new Date(Date.now() + 3600000),
            );

            mockRepository.findPendingExpired.mockResolvedValue([inv1, inv2]);
            mockRepository.expireAllPending.mockResolvedValue(2);

            const result = await useCase.execute(new Date());

            expect(result).toBe(2);
            expect(mockRepository.findPendingExpired).toHaveBeenCalled();
            // Un solo UPDATE masivo con los ids de las invitaciones vencidas.
            expect(mockRepository.expireAllPending).toHaveBeenCalledTimes(1);
            expect(mockRepository.expireAllPending).toHaveBeenCalledWith([1, 2]);
            // Una sola desactivación en bloque con todos los correos.
            expect(deactivateInvitedUser.executeMany).toHaveBeenCalledTimes(1);
            expect(deactivateInvitedUser.executeMany).toHaveBeenCalledWith([
                'user1@test.com',
                'user2@test.com',
            ]);
        });

        it('should return 0 when no overdue invitations', async () => {
            mockRepository.findPendingExpired.mockResolvedValue([]);

            const result = await useCase.execute(new Date());

            expect(result).toBe(0);
            expect(mockRepository.expireAllPending).not.toHaveBeenCalled();
            expect(deactivateInvitedUser.executeMany).not.toHaveBeenCalled();
        });

        it('should use current date when no date provided', async () => {
            mockRepository.findPendingExpired.mockResolvedValue([]);

            await useCase.execute();

            expect(mockRepository.findPendingExpired).toHaveBeenCalled();
        });

        it('should propagate repository errors', async () => {
            mockRepository.findPendingExpired.mockRejectedValue(
                new Error('DB error'),
            );

            await expect(useCase.execute(new Date())).rejects.toThrow(
                'DB error',
            );
        });
    });
});
