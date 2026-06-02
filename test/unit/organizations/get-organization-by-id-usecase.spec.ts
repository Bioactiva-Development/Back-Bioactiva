import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetOrganizationByIdUseCase } from '@/modules/organizations/application/use-cases/get-organization-by-id.use-case';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';

describe('Organizations module', () => {
	describe('GetOrganizationByIdUseCase', () => {
		let useCase: GetOrganizationByIdUseCase;
		let mockRepository: any;

		beforeEach(() => {
			mockRepository = {
				findById: jest.fn(),
			};
			useCase = new GetOrganizationByIdUseCase(mockRepository);
		});

		it('should return organization when found', async () => {
			const org = new Organization('org-1', 'CLI-001', 'Tech Corp', 'Tech', 'Area', '20123456789', EnterpriseType.EMPRESA_NACIONAL, '', '', Sector.TECNOLOGIA, Size.GRANDE, '', '', null, 1, new Date(), new Date());
			mockRepository.findById.mockResolvedValue(org);

			const result = await useCase.execute('org-1');

			expect(result).toEqual(org);
			expect(mockRepository.findById).toHaveBeenCalledWith('org-1');
		});

		it('should return null when organization not found', async () => {
			mockRepository.findById.mockResolvedValue(null);

			const result = await useCase.execute('non-existent');

			expect(result).toBeNull();
		});

		it('should propagate repository errors', async () => {
			mockRepository.findById.mockRejectedValue(new Error('DB error'));

			await expect(useCase.execute('org-1')).rejects.toThrow('DB error');
		});
	});
});
