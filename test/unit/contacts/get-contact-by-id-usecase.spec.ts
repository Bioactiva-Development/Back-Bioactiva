import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetContactByIdUseCase } from '@/modules/contacts/application/use-cases/get-contact-by-id.use-case';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';

describe('Contacts module', () => {
    describe('GetContactByIdUseCase', () => {
        let useCase: GetContactByIdUseCase;
        let mockRepository: any;

        beforeEach(() => {
            mockRepository = {
                findByIdWithOrganization: jest.fn(),
            };
            useCase = new GetContactByIdUseCase(mockRepository);
        });

        it('should return contact when found', async () => {
            const contact = {
                id: 1,
                nombres: 'Juan',
                organizationName: 'Org A',
            };
            mockRepository.findByIdWithOrganization.mockResolvedValue(contact);

            const result = await useCase.execute(1);

            expect(result).toEqual(contact);
            expect(
                mockRepository.findByIdWithOrganization,
            ).toHaveBeenCalledWith(1);
        });

        it('should throw ContactNotFoundException when not found', async () => {
            mockRepository.findByIdWithOrganization.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toThrow(
                ContactNotFoundException,
            );
        });

        it('should propagate repository errors', async () => {
            mockRepository.findByIdWithOrganization.mockRejectedValue(
                new Error('DB error'),
            );

            await expect(useCase.execute(1)).rejects.toThrow('DB error');
        });
    });
});
