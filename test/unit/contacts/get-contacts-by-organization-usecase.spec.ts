import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetContactsByOrganizationUseCase } from '@/modules/contacts/application/use-cases/get-contacts-by-organization.use-case';

describe('Contacts module', () => {
    describe('GetContactsByOrganizationUseCase', () => {
        let useCase: GetContactsByOrganizationUseCase;
        let mockRepository: any;

        beforeEach(() => {
            mockRepository = {
                findByOrganizationIdWithOrganization: jest.fn(),
            };
            useCase = new GetContactsByOrganizationUseCase(mockRepository);
        });

        it('should return contacts for organization', async () => {
            const contacts = [
                { id: 1, nombres: 'Juan', idOrganizacion: 'org-1' },
            ];
            mockRepository.findByOrganizationIdWithOrganization.mockResolvedValue(
                contacts,
            );

            const result = await useCase.execute('org-1');

            expect(result).toEqual(contacts);
            expect(
                mockRepository.findByOrganizationIdWithOrganization,
            ).toHaveBeenCalledWith('org-1');
        });

        it('should handle empty contacts for organization', async () => {
            mockRepository.findByOrganizationIdWithOrganization.mockResolvedValue(
                [],
            );

            const result = await useCase.execute('org-empty');

            expect(result).toEqual([]);
        });

        it('should propagate repository errors', async () => {
            mockRepository.findByOrganizationIdWithOrganization.mockRejectedValue(
                new Error('DB error'),
            );

            await expect(useCase.execute('org-1')).rejects.toThrow('DB error');
        });
    });
});
