import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetAllOrganizationsUseCase } from '@/modules/organizations/application/use-cases/get-all-organizations.use-case';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { PrismaOrganizationRepository } from '@/modules/organizations/infrastructure/persistance/prisma-organization.repository';

/**
 * Branch coverage extra:
 *  - GetAllOrganizationsUseCase: `dto = new ListOrganizationsDto()` por defecto
 *    al llamar execute() sin argumento.
 *  - Organization.updateRuc: RUC inválido lanza; RUC válido (11 dígitos) pasa.
 *  - PrismaOrganizationRepository.findByCodigoCliente: lado null cuando
 *    findUnique resuelve null.
 */
describe('Organizations module — branches2', () => {
    describe('GetAllOrganizationsUseCase', () => {
        it('uses a default ListOrganizationsDto when called with no argument', async () => {
            const repository = {
                findAll: jest.fn<any>().mockResolvedValue([]),
                countAll: jest.fn<any>().mockResolvedValue(0),
            };
            const useCase = new GetAllOrganizationsUseCase(repository as any);

            const result = await useCase.execute();

            expect(result).toEqual({ data: [], total: 0 });
            expect(repository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ page: 1, limit: 10 }),
            );
            expect(repository.countAll).toHaveBeenCalled();
        });
    });

    describe('Organization.updateRuc', () => {
        const buildOrg = () =>
            new Organization(
                'org-1',
                'CLI-001',
                'Tech Corp',
                'TechCorp',
                null,
                null,
                EnterpriseType.EMPRESA_NACIONAL,
                null,
                null,
                null,
                Size.MICRO,
                null,
                null,
                null,
                1,
                new Date(),
                new Date(),
                null,
            );

        it('throws when the RUC is not 11 digits', () => {
            expect(() => buildOrg().updateRuc('123')).toThrow(
                'El RUC debe tener 11 dígitos',
            );
        });

        it('accepts a valid 11-digit RUC', () => {
            const org = buildOrg();
            org.updateRuc('20123456789');
            expect(org.ruc).toBe('20123456789');
        });
    });

    describe('PrismaOrganizationRepository.findByCodigoCliente', () => {
        let repository: PrismaOrganizationRepository;
        let mockPrisma: any;

        beforeEach(() => {
            mockPrisma = {
                organizacion: {
                    findUnique: jest.fn(),
                },
            };
            repository = new PrismaOrganizationRepository(mockPrisma as any);
        });

        it('returns null when no record matches the codigoCliente', async () => {
            mockPrisma.organizacion.findUnique.mockResolvedValue(null);

            const result = await repository.findByCodigoCliente('CLI-404');

            expect(result).toBeNull();
        });

        it('returns the domain entity when a record matches', async () => {
            mockPrisma.organizacion.findUnique.mockResolvedValue({
                id: 'org-1',
                codigoCliente: 'CLI-001',
                nombre: 'Tech Corp',
                nombreComercial: 'TechCorp',
                subArea: null,
                ruc: null,
                tipo: 'EMPRESA_NACIONAL',
                linkedin: null,
                ubicacion: null,
                sector: null,
                tamano: 'MICRO',
                actividadEconomica: null,
                alianzasEstrategicas: null,
                idContactoActivo: null,
                idAuthor: 1,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                deletedAt: null,
            });

            const result = await repository.findByCodigoCliente('CLI-001');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('org-1');
        });
    });
});
