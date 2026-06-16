import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetAllOrganizationsUseCase } from '@/modules/organizations/application/use-cases/get-all-organizations.use-case';
import { ListOrganizationsDto } from '@/modules/organizations/application/dto/list-organizations.dto';
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
                countAll: jest.fn(),
            };
            useCase = new GetAllOrganizationsUseCase(mockRepository);
        });

        it('should return paginated organizations with total', async () => {
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
            mockRepository.countAll.mockResolvedValue(1);

            const result = await useCase.execute(new ListOrganizationsDto());

            expect(result.data).toEqual(orgs);
            expect(result.total).toBe(1);
            expect(mockRepository.findAll).toHaveBeenCalledWith({
                sector: undefined,
                tamano: undefined,
                tipo: undefined,
                page: 1,
                limit: 10,
            });
        });

        it('should pass sector, tamano and tipo filters to the repository', async () => {
            mockRepository.findAll.mockResolvedValue([]);
            mockRepository.countAll.mockResolvedValue(0);

            const dto = new ListOrganizationsDto(
                Sector.TECNOLOGIA,
                Size.GRANDE,
                EnterpriseType.EMPRESA_NACIONAL,
                2,
                5,
            );
            await useCase.execute(dto);

            expect(mockRepository.findAll).toHaveBeenCalledWith({
                sector: Sector.TECNOLOGIA,
                tamano: Size.GRANDE,
                tipo: EnterpriseType.EMPRESA_NACIONAL,
                page: 2,
                limit: 5,
            });
            expect(mockRepository.countAll).toHaveBeenCalledWith({
                sector: Sector.TECNOLOGIA,
                tamano: Size.GRANDE,
                tipo: EnterpriseType.EMPRESA_NACIONAL,
            });
        });

        it('should handle empty organizations list', async () => {
            mockRepository.findAll.mockResolvedValue([]);
            mockRepository.countAll.mockResolvedValue(0);

            const result = await useCase.execute(new ListOrganizationsDto());

            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
        });

        it('should propagate repository errors', async () => {
            mockRepository.findAll.mockRejectedValue(new Error('DB error'));
            mockRepository.countAll.mockResolvedValue(0);

            await expect(
                useCase.execute(new ListOrganizationsDto()),
            ).rejects.toThrow('DB error');
        });
    });
});
