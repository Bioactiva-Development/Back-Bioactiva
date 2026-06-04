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
                save: jest.fn(),
            };
            deactivateInvitedUser = {
                execute: jest.fn(() => Promise.resolve()),
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
            mockRepository.save.mockResolvedValue({});

            const result = await useCase.execute(new Date());

            expect(result).toBe(2);
            expect(mockRepository.findPendingExpired).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalledTimes(2);
            expect(deactivateInvitedUser.execute).toHaveBeenCalledTimes(2);
            expect(deactivateInvitedUser.execute).toHaveBeenCalledWith(
                'user1@test.com',
            );
            expect(deactivateInvitedUser.execute).toHaveBeenCalledWith(
                'user2@test.com',
            );
        });

        it('should return 0 when no overdue invitations', async () => {
            mockRepository.findPendingExpired.mockResolvedValue([]);

            const result = await useCase.execute(new Date());

            expect(result).toBe(0);
            expect(mockRepository.save).not.toHaveBeenCalled();
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
