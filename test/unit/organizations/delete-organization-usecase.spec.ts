import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DeleteOrganizationUseCase } from '@/modules/organizations/application/use-cases/delete-organization.use-case';
import { OrganizationNotFoundException } from '@/modules/organizations/domain/exceptions/organization-not-found.exception';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';

describe('Organizations module', () => {
    describe('DeleteOrganizationUseCase', () => {
        let useCase: DeleteOrganizationUseCase;
        let mockRepository: any;

        const buildOrg = () =>
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
            );

        beforeEach(() => {
            mockRepository = {
                findById: jest.fn(),
                softDelete: jest.fn(),
            };
            useCase = new DeleteOrganizationUseCase(mockRepository);
        });

        it('should soft-delete the organization (cascading to its contacts) when it exists', async () => {
            mockRepository.findById.mockResolvedValue(buildOrg());
            mockRepository.softDelete.mockResolvedValue(undefined);

            const result = await useCase.execute('org-1');

            expect(mockRepository.findById).toHaveBeenCalledWith('org-1');
            expect(mockRepository.softDelete).toHaveBeenCalledWith('org-1');
            expect(result).toEqual({ ok: true });
        });

        it('should throw OrganizationNotFoundException when the organization does not exist', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
                OrganizationNotFoundException,
            );
            expect(mockRepository.softDelete).not.toHaveBeenCalled();
        });
    });
});
