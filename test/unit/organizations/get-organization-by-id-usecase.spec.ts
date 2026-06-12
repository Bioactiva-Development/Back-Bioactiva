import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
    GetOrganizationByIdUseCase,
    DASHBOARD_CONTACTS_LIMIT,
} from '@/modules/organizations/application/use-cases/get-organization-by-id.use-case';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';

describe('Organizations module', () => {
    describe('GetOrganizationByIdUseCase', () => {
        let useCase: GetOrganizationByIdUseCase;
        let mockOrgRepository: any;
        let mockContactRepository: any;

        const org = new Organization(
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
            mockOrgRepository = {
                findById: jest.fn(),
            };
            mockContactRepository = {
                list: jest.fn(),
                count: jest.fn(),
            };
            useCase = new GetOrganizationByIdUseCase(
                mockOrgRepository,
                mockContactRepository,
            );
        });

        it('should return organization with its first contacts and total', async () => {
            const contactos = [
                { contact: { id: 1 }, organizationName: 'Tech Corp' },
            ];
            mockOrgRepository.findById.mockResolvedValue(org);
            mockContactRepository.list.mockResolvedValue(contactos);
            mockContactRepository.count.mockResolvedValue(14);

            const result = await useCase.execute('org-1');

            expect(result).toEqual({
                organization: org,
                contactos,
                totalContactos: 14,
            });
            expect(mockOrgRepository.findById).toHaveBeenCalledWith('org-1');
            expect(mockContactRepository.list).toHaveBeenCalledWith({
                idOrganization: 'org-1',
                page: 1,
                limit: DASHBOARD_CONTACTS_LIMIT,
            });
            expect(mockContactRepository.count).toHaveBeenCalledWith({
                idOrganization: 'org-1',
            });
        });

        it('should cap the embedded contacts at 6', async () => {
            mockOrgRepository.findById.mockResolvedValue(org);
            mockContactRepository.list.mockResolvedValue([]);
            mockContactRepository.count.mockResolvedValue(0);

            await useCase.execute('org-1');

            expect(DASHBOARD_CONTACTS_LIMIT).toBe(6);
            expect(mockContactRepository.list).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 6 }),
            );
        });

        it('should return null and not query contacts when organization not found', async () => {
            mockOrgRepository.findById.mockResolvedValue(null);

            const result = await useCase.execute('non-existent');

            expect(result).toBeNull();
            expect(mockContactRepository.list).not.toHaveBeenCalled();
            expect(mockContactRepository.count).not.toHaveBeenCalled();
        });

        it('should propagate repository errors', async () => {
            mockOrgRepository.findById.mockRejectedValue(new Error('DB error'));

            await expect(useCase.execute('org-1')).rejects.toThrow('DB error');
        });
    });
});
