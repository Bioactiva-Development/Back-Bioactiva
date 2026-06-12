import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ListInvitationsUseCase } from '@/modules/invitations/application/use-cases/list-invitations.use-case';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

describe('Invitations module', () => {
    describe('ListInvitationsUseCase', () => {
        let useCase: ListInvitationsUseCase;
        let mockRepository: any;

        beforeEach(() => {
            mockRepository = {
                list: jest.fn(),
            };
            useCase = new ListInvitationsUseCase(mockRepository);
        });

        it('should list invitations with all params', async () => {
            const invitations = [{ id: 1, correo: 'test@test.com' }];
            mockRepository.list.mockResolvedValue(invitations);

            const result = await useCase.execute(
                1,
                10,
                'test',
                TokenStatus.PENDIENTE,
            );

            expect(result).toEqual(invitations);
            expect(mockRepository.list).toHaveBeenCalledWith(
                1,
                10,
                'test',
                TokenStatus.PENDIENTE,
            );
        });

        it('should list invitations without optional params', async () => {
            mockRepository.list.mockResolvedValue([]);

            const result = await useCase.execute();

            expect(result).toEqual([]);
            expect(mockRepository.list).toHaveBeenCalledWith(
                undefined,
                undefined,
                undefined,
                undefined,
            );
        });

        it('should propagate repository errors', async () => {
            mockRepository.list.mockRejectedValue(new Error('DB error'));

            await expect(useCase.execute()).rejects.toThrow('DB error');
        });
    });
});
