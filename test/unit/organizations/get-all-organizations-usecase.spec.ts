import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetAllOrganizationsUseCase } from '@/modules/organizations/application/use-cases/get-all-organizations.use-case';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';

describe('Organizations module', () => {
    describe('GetAllOrganizationsUseCase', () => {
        let useCase: GetAllOrganizationsUseCase;
        let mockRepository: any;

        beforeEach(() => {
            mockRepository = {
                findAll: jest.fn(),
            };
            useCase = new GetAllOrganizationsUseCase(mockRepository);
        });

        it('should return all organizations', async () => {
            const orgs = [
                new Organization(
                    'org-1',
                    'CLI-001',
                    'Tech Corp',
                    'Tech',
                    'Area',
                    '20123456789',
                    EnterpriseType.EMPRESA_NACIONAL,
                    '',
                    '',
                    Sector.TECNOLOGIA,
                    Size.GRANDE,
                    '',
                    '',
                    null,
                    1,
                    new Date(),
                    new Date(),
                ),
            ];
            mockRepository.findAll.mockResolvedValue(orgs);

            const result = await useCase.execute();

            expect(result).toEqual(orgs);
            expect(mockRepository.findAll).toHaveBeenCalled();
        });

        it('should handle empty organizations list', async () => {
            mockRepository.findAll.mockResolvedValue([]);

            const result = await useCase.execute();

            expect(result).toEqual([]);
        });

        it('should propagate repository errors', async () => {
            mockRepository.findAll.mockRejectedValue(new Error('DB error'));

            await expect(useCase.execute()).rejects.toThrow('DB error');
        });
    });
});
