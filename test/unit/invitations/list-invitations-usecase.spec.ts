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
                count: jest.fn(),
            };
            useCase = new ListInvitationsUseCase(mockRepository);
        });

        it('should list invitations with all params', async () => {
            const invitations = [{ id: 1, correo: 'test@test.com' }];
            mockRepository.list.mockResolvedValue(invitations);
            mockRepository.count.mockResolvedValue(1);

            const result = await useCase.execute(
                1,
                10,
                'test',
                TokenStatus.PENDIENTE,
            );

            expect(result).toEqual({ data: invitations, total: 1 });
            expect(mockRepository.list).toHaveBeenCalledWith(
                1,
                10,
                'test',
                TokenStatus.PENDIENTE,
            );
            expect(mockRepository.count).toHaveBeenCalledWith(
                'test',
                TokenStatus.PENDIENTE,
            );
        });

        it('should list invitations without optional params', async () => {
            mockRepository.list.mockResolvedValue([]);
            mockRepository.count.mockResolvedValue(0);

            const result = await useCase.execute();

            expect(result).toEqual({ data: [], total: 0 });
            expect(mockRepository.list).toHaveBeenCalledWith(
                undefined,
                undefined,
                undefined,
                undefined,
            );
            expect(mockRepository.count).toHaveBeenCalledWith(
                undefined,
                undefined,
            );
        });

        it('should propagate repository errors', async () => {
            mockRepository.list.mockRejectedValue(new Error('DB error'));
            mockRepository.count.mockResolvedValue(0);

            await expect(useCase.execute()).rejects.toThrow('DB error');
        });
    });
});
