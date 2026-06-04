import { describe, expect, it, beforeEach } from '@jest/globals';
import { UpdateOrganizationUseCase } from '@/modules/organizations/application/use-cases/update-organization.use-case';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { OrganizationAlreadyExistsException } from '@/modules/organizations/domain/exceptions/organization-already-exists.exception';
import { InvalidRucException } from '@/modules/organizations/domain/exceptions/invalid-ruc.exception';
import { DuplicateClientCodeException } from '@/modules/organizations/domain/exceptions/duplicate-client-code.exception';
import { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { ISunatService } from '@/modules/organizations/domain/ports/sunat.service';
import { UpdateOrganizationDto } from '@/modules/organizations/application/dtos/update-organization.dto';

describe('Organizations module', () => {
    /**
     * UpdateOrganizationUseCase
     * ----------
     * Responsable de:
     * - buscar organización existente por ID
     * - validar nuevos RUC contra SUNAT si cambian
     * - actualizar múltiples campos permitidos
     * - persistir cambios
     * - mantener integridad de datos
     */
    // STATUS: Implementación completa (validaciones y actualizaciones).
    describe('UpdateOrganizationUseCase', () => {
        let useCase: UpdateOrganizationUseCase;
        let mockRepository: Partial<IOrganizationRepository>;
        let mockSunatService: Partial<ISunatService>;

        const existingOrg = new Organization(
            'org-1',
            'CLI-001',
            'Tech Corp Peru',
            'TechCorp',
            'Technology',
            '20123456789',
            EnterpriseType.EMPRESA_NACIONAL,
            'https://linkedin.com/company/techcorp',
            'Lima, Peru',
            Sector.TECNOLOGIA,
            Size.GRANDE,
            'Software Development',
            'Microsoft, Google',
            1,
            1,
            new Date('2024-01-01'),
            new Date('2024-01-01'),
        );

        beforeEach(() => {
            mockRepository = {
                findById: jest.fn(),
                findByRuc: jest.fn(),
                findByCodigoCliente: jest.fn().mockResolvedValue(null),
                save: jest.fn(),
                findAll: jest.fn(),
            };

            mockSunatService = {
                validateRuc: jest.fn(),
            };

            useCase = new UpdateOrganizationUseCase(
                mockRepository as IOrganizationRepository,
                mockSunatService as ISunatService,
            );
        });

        it('should update organization with new valid name', async () => {
            const updateDto: UpdateOrganizationDto = {
                nombre: 'Tech Corp Updated',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue({
                ...existingOrg,
                nombre: updateDto.nombre,
            });

            const result = await useCase.execute('org-1', updateDto);

            expect(mockRepository.findById).toHaveBeenCalledWith('org-1');
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw error when organization not found', async () => {
            (mockRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                useCase.execute('org-nonexistent', {}),
            ).rejects.toThrow('Organización no encontrada');
            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should validate new RUC with SUNAT', async () => {
            const updateDto: UpdateOrganizationDto = { ruc: '20987654321' };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.findByRuc as jest.Mock).mockResolvedValue(null);
            (mockSunatService.validateRuc as jest.Mock).mockResolvedValue(true);
            (mockRepository.save as jest.Mock).mockResolvedValue(existingOrg);

            await useCase.execute('org-1', updateDto);

            expect(mockRepository.findByRuc).toHaveBeenCalledWith(
                '20987654321',
            );
            expect(mockSunatService.validateRuc).toHaveBeenCalledWith(
                '20987654321',
            );
        });

        it('should reject if new RUC already exists', async () => {
            const updateDto: UpdateOrganizationDto = { ruc: '20987654321' };
            const conflictingOrg = new Organization(
                'org-2',
                'CLI-002',
                'Other Corp',
                'Other',
                '',
                '20987654321', // Different RUC
                EnterpriseType.EMPRESA_NACIONAL,
                '',
                '',
                null,
                Size.PEQUENO,
                '',
                '',
                null,
                1,
                new Date(),
                new Date(),
            );

            // Create fresh organization to avoid state mutation issues
            const orgForTest = new Organization(
                'org-1',
                'CLI-001',
                'Tech Corp Peru',
                'TechCorp',
                'Technology',
                '20123456789', // Original RUC
                EnterpriseType.EMPRESA_NACIONAL,
                'https://linkedin.com/company/techcorp',
                'Lima, Peru',
                Sector.TECNOLOGIA,
                Size.GRANDE,
                'Software Development',
                'Microsoft, Google',
                1,
                1,
                new Date('2024-01-01'),
                new Date('2024-01-01'),
            );

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                orgForTest,
            );
            (mockRepository.findByRuc as jest.Mock).mockResolvedValue(
                conflictingOrg,
            );

            await expect(useCase.execute('org-1', updateDto)).rejects.toThrow(
                OrganizationAlreadyExistsException,
            );
            expect(mockSunatService.validateRuc).not.toHaveBeenCalled();
        });

        it('should reject if new client code belongs to another organization (Mantis #189)', async () => {
            const updateDto: UpdateOrganizationDto = { codigoCliente: 'CLI-999' };

            const orgForTest = new Organization(
                'org-1',
                'CLI-001',
                'Tech Corp Peru',
                'TechCorp',
                'Technology',
                '20123456789',
                EnterpriseType.EMPRESA_NACIONAL,
                'https://linkedin.com/company/techcorp',
                'Lima, Peru',
                Sector.TECNOLOGIA,
                Size.GRANDE,
                'Software Development',
                'Microsoft, Google',
                1,
                1,
                new Date('2024-01-01'),
                new Date('2024-01-01'),
            );
            const conflictingOrg = new Organization(
                'org-2',
                'CLI-999',
                'Other Corp',
                'Other',
                '',
                null,
                EnterpriseType.EMPRESA_NACIONAL,
                '',
                '',
                null,
                Size.PEQUENO,
                '',
                '',
                null,
                1,
                new Date(),
                new Date(),
            );

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                orgForTest,
            );
            (
                mockRepository.findByCodigoCliente as jest.Mock
            ).mockResolvedValue(conflictingOrg);

            await expect(useCase.execute('org-1', updateDto)).rejects.toThrow(
                DuplicateClientCodeException,
            );
            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should not check client code uniqueness if unchanged', async () => {
            const updateDto: UpdateOrganizationDto = {
                codigoCliente: 'CLI-001',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue(existingOrg);

            await useCase.execute('org-1', updateDto);

            expect(
                mockRepository.findByCodigoCliente,
            ).not.toHaveBeenCalled();
        });

        it('should not validate RUC if unchanged', async () => {
            const updateDto: UpdateOrganizationDto = { nombre: 'Updated Name' };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue(existingOrg);

            await useCase.execute('org-1', updateDto);

            expect(mockRepository.findByRuc).not.toHaveBeenCalled();
            expect(mockSunatService.validateRuc).not.toHaveBeenCalled();
        });

        it('should reject invalid RUC', async () => {
            const updateDto: UpdateOrganizationDto = { ruc: '20987654321' };

            // Create fresh organization to avoid state mutation from previous tests
            const orgForTest = new Organization(
                'org-1',
                'CLI-001',
                'Tech Corp Peru',
                'TechCorp',
                'Technology',
                '20123456789', // Original RUC
                EnterpriseType.EMPRESA_NACIONAL,
                'https://linkedin.com/company/techcorp',
                'Lima, Peru',
                Sector.TECNOLOGIA,
                Size.GRANDE,
                'Software Development',
                'Microsoft, Google',
                1,
                1,
                new Date('2024-01-01'),
                new Date('2024-01-01'),
            );

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                orgForTest,
            );
            (mockRepository.findByRuc as jest.Mock).mockResolvedValue(null);
            (mockSunatService.validateRuc as jest.Mock).mockResolvedValue(
                false,
            );

            await expect(useCase.execute('org-1', updateDto)).rejects.toThrow(
                InvalidRucException,
            );
            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should update multiple fields', async () => {
            const updateDto: UpdateOrganizationDto = {
                nombre: 'Tech Corp Updated',
                nombreComercial: 'TechCorp New',
                codigoCliente: 'CLI-002',
                tipo: EnterpriseType.EMPRESA_INTERNACIONAL,
                tamano: Size.MEDIANO,
                sector: Sector.INFORMATICA,
                ubicacion: 'Cusco, Peru',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            const updatedOrg = {
                ...existingOrg,
                ...updateDto,
                updatedAt: new Date(),
            };
            (mockRepository.save as jest.Mock).mockResolvedValue(updatedOrg);

            const result = await useCase.execute('org-1', updateDto);

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should call rename method when nombre changes', async () => {
            const updateDto: UpdateOrganizationDto = {
                nombre: 'New Company Name',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue({
                ...existingOrg,
                nombre: updateDto.nombre,
            });

            const renameSpy = jest.spyOn(existingOrg, 'rename');

            await useCase.execute('org-1', updateDto);

            expect(renameSpy).toHaveBeenCalledWith(updateDto.nombre);
        });

        it('should call updateCommercialName when nombreComercial changes', async () => {
            const updateDto: UpdateOrganizationDto = {
                nombreComercial: 'New Commercial Name',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue({
                ...existingOrg,
                nombreComercial: updateDto.nombreComercial,
            });

            const updateCommercialNameSpy = jest.spyOn(
                existingOrg,
                'updateCommercialName',
            );

            await useCase.execute('org-1', updateDto);

            expect(updateCommercialNameSpy).toHaveBeenCalledWith(
                updateDto.nombreComercial,
            );
        });

        it('should update timestamp on save', async () => {
            const updateDto: UpdateOrganizationDto = { nombre: 'Updated' };
            const beforeUpdate = new Date();

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            const savedOrg = { ...existingOrg, updatedAt: new Date() };
            (mockRepository.save as jest.Mock).mockResolvedValue(savedOrg);

            const result = await useCase.execute('org-1', updateDto);

            expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
                beforeUpdate.getTime(),
            );
        });

        it('should update subArea when provided', async () => {
            const updateDto: UpdateOrganizationDto = {
                subArea: 'Nuevo SubArea',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue(existingOrg);

            await useCase.execute('org-1', updateDto);

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should update linkedin when provided', async () => {
            const updateDto: UpdateOrganizationDto = {
                linkedin: 'https://linkedin.com/company/new',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue(existingOrg);

            await useCase.execute('org-1', updateDto);

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should update actividadEconomica when provided', async () => {
            const updateDto: UpdateOrganizationDto = {
                actividadEconomica: 'Nueva Actividad',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue(existingOrg);

            await useCase.execute('org-1', updateDto);

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should update alianzasEstrategicas when provided', async () => {
            const updateDto: UpdateOrganizationDto = {
                alianzasEstrategicas: 'Aliado1, Aliado2',
            };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue(existingOrg);

            await useCase.execute('org-1', updateDto);

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should update idContactoActivo when provided', async () => {
            const updateDto: UpdateOrganizationDto = { idContactoActivo: 5 };

            (mockRepository.findById as jest.Mock).mockResolvedValue(
                existingOrg,
            );
            (mockRepository.save as jest.Mock).mockResolvedValue(existingOrg);

            await useCase.execute('org-1', updateDto);

            expect(mockRepository.save).toHaveBeenCalled();
        });
    });
});
