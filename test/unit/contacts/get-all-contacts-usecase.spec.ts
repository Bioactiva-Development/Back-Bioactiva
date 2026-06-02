import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetAllContactsUseCase } from '@/modules/contacts/application/use-cases/get-all-contacts.use-case';

describe('Contacts module', () => {
	describe('GetAllContactsUseCase', () => {
		let useCase: GetAllContactsUseCase;
		let mockRepository: any;

		beforeEach(() => {
			mockRepository = {
				findAllWithOrganization: jest.fn(),
			};
			useCase = new GetAllContactsUseCase(mockRepository);
		});

		it('should return all contacts with organization names', async () => {
			const contacts = [
				{ id: 1, nombres: 'Juan', organizationName: 'Org A' },
				{ id: 2, nombres: 'Maria', organizationName: 'Org B' },
			];
			mockRepository.findAllWithOrganization.mockResolvedValue(contacts);

			const result = await useCase.execute();

			expect(result).toEqual(contacts);
			expect(mockRepository.findAllWithOrganization).toHaveBeenCalled();
		});

		it('should handle empty contacts list', async () => {
			mockRepository.findAllWithOrganization.mockResolvedValue([]);

			const result = await useCase.execute();

			expect(result).toEqual([]);
		});

		it('should propagate repository errors', async () => {
			mockRepository.findAllWithOrganization.mockRejectedValue(new Error('DB error'));

			await expect(useCase.execute()).rejects.toThrow('DB error');
		});
	});
});
