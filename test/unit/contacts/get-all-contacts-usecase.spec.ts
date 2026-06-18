import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetAllContactsUseCase } from '@/modules/contacts/application/use-cases/get-all-contacts.use-case';
import { ListContactsDto } from '@/modules/contacts/application/dtos/list-contacts.dto';

describe('Contacts module', () => {
    describe('GetAllContactsUseCase', () => {
        let useCase: GetAllContactsUseCase;
        let mockRepository: any;

        beforeEach(() => {
            mockRepository = {
                list: jest.fn(),
                count: jest.fn(),
            };
            useCase = new GetAllContactsUseCase(mockRepository);
        });

        it('should return paginated contacts with organization names', async () => {
            const contacts = [
                { id: 1, nombres: 'Juan', organizationName: 'Org A' },
                { id: 2, nombres: 'Maria', organizationName: 'Org B' },
            ];
            mockRepository.list.mockResolvedValue(contacts);
            mockRepository.count.mockResolvedValue(2);

            const result = await useCase.execute();

            expect(result).toEqual({ data: contacts, total: 2 });
            expect(mockRepository.list).toHaveBeenCalled();
            expect(mockRepository.count).toHaveBeenCalled();
        });

        it('should forward search filter and pagination to the repository', async () => {
            mockRepository.list.mockResolvedValue([]);
            mockRepository.count.mockResolvedValue(0);

            const dto = new ListContactsDto('Juan', 2, 5);
            await useCase.execute(dto);

            expect(mockRepository.list).toHaveBeenCalledWith({
                search: 'Juan',
                page: 2,
                limit: 5,
            });
            expect(mockRepository.count).toHaveBeenCalledWith({
                search: 'Juan',
            });
        });

        it('should handle empty contacts list', async () => {
            mockRepository.list.mockResolvedValue([]);
            mockRepository.count.mockResolvedValue(0);

            const result = await useCase.execute();

            expect(result).toEqual({ data: [], total: 0 });
        });

        it('should propagate repository errors', async () => {
            mockRepository.list.mockRejectedValue(new Error('DB error'));
            mockRepository.count.mockResolvedValue(0);

            await expect(useCase.execute()).rejects.toThrow('DB error');
        });
    });
});
