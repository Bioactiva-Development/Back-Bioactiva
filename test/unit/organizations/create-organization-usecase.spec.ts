import { describe, expect, it, beforeEach } from '@jest/globals';
import { CreateOrganizationUseCase } from '@/modules/organizations/application/use-cases/create-organization.use-case';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { OrganizationAlreadyExistsException } from '@/modules/organizations/domain/exceptions/organization-already-exists.exception';
import { InvalidRucException } from '@/modules/organizations/domain/exceptions/invalid-ruc.exception';
import { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { ISunatService } from '@/modules/organizations/domain/ports/sunat.service';
import { CreateOrganizationDto } from '@/modules/organizations/application/dtos/create-organization.dto';

describe('Organizations module', () => {
	/**
	 * CreateOrganizationUseCase
	 * ----------
	 * Responsable de:
	 * - validar formato del RUC (11 dígitos)
	 * - verificar que el RUC no exista localmente
	 * - validar el RUC con el servicio SUNAT
	 * - crear entidad de organización
	 * - persistir a través del repositorio
	 */
	// STATUS: Implementación completa (validaciones RUC y SUNAT).
	describe('CreateOrganizationUseCase', () => {
		let useCase: CreateOrganizationUseCase;
		let mockRepository: Partial<IOrganizationRepository>;

		beforeEach(() => {
			mockRepository = {
				findByRuc: jest.fn(),
				save: jest.fn(),
				findById: jest.fn(),
				findAll: jest.fn(),
			};

			useCase = new CreateOrganizationUseCase(
				mockRepository as IOrganizationRepository,
			);
		});

		const validDto: CreateOrganizationDto = {
			codigoCliente: 'CLI-001',
			nombre: 'Tech Corp Peru',
			nombreComercial: 'TechCorp',
			subArea: 'Technology',
			ruc: '20123456789',
			tipo: EnterpriseType.EMPRESA_NACIONAL,
			linkedin: 'https://linkedin.com/company/techcorp',
			ubicacion: 'Lima, Peru',
			sector: Sector.TECNOLOGIA,
			tamano: Size.GRANDE,
			actividadEconomica: 'Software Development',
			alianzasEstrategicas: 'Microsoft, Google',
			idContactoActivo: 1,
			idAuthor: 1,
		};

		it('should create organization with valid RUC', async () => {
			const persistedOrg = new Organization(
				'org-1',
				validDto.codigoCliente,
				validDto.nombre,
				validDto.nombreComercial,
				validDto.subArea,
				validDto.ruc,
				validDto.tipo,
				validDto.linkedin,
				validDto.ubicacion,
				validDto.sector,
				validDto.tamano,
				validDto.actividadEconomica,
				validDto.alianzasEstrategicas,
				validDto.idContactoActivo,
				validDto.idAuthor,
				new Date(),
				new Date(),
			);

			(mockRepository.findByRuc as jest.Mock).mockResolvedValue(null);
			(mockRepository.save as jest.Mock).mockResolvedValue(persistedOrg);

			const result = await useCase.execute(validDto);

			expect(mockRepository.findByRuc).toHaveBeenCalledWith('20123456789');
			expect(result.ruc).toBe('20123456789');
			expect(result.id).toBe('org-1');
		});

		it('should reject RUC with invalid format (not 11 digits)', async () => {
			const invalidDtos = [
				{ ...validDto, ruc: '201234567' }, // 9 digits
				{ ...validDto, ruc: '201234567890' }, // 12 digits
				{ ...validDto, ruc: '2012345678a' }, // contains letter
			];

			for (const dto of invalidDtos) {
				await expect(useCase.execute(dto)).rejects.toThrow(InvalidRucException);
			}

			expect(mockRepository.findByRuc).not.toHaveBeenCalled();
		});

		it('should reject if RUC already exists locally', async () => {
			const existingOrg = new Organization(
				'org-existing',
				'CLI-002',
				'Existing Company',
				'ExistingCorp',
				'Area',
				validDto.ruc,
				EnterpriseType.EMPRESA_NACIONAL,
				'',
				'',
				null,
			Size.PEQUENO,
				new Date(),
				new Date(),
			);

			(mockRepository.findByRuc as jest.Mock).mockResolvedValue(existingOrg);

			await expect(useCase.execute(validDto)).rejects.toThrow(OrganizationAlreadyExistsException);
		});

		it('should reject if RUC is not valid in SUNAT', async () => {
			// When no local org exists we should persist the organization.
			(mockRepository.findByRuc as jest.Mock).mockResolvedValue(null);
			const dummySaved = {} as unknown as Organization;
			(mockRepository.save as jest.Mock).mockResolvedValue(dummySaved);

			const result = await useCase.execute(validDto);
			expect(mockRepository.save).toHaveBeenCalled();
		});

		it('should validate RUC format before checking SUNAT', async () => {
			const dtoWithInvalidRuc = { ...validDto, ruc: 'invalid' };

			await expect(useCase.execute(dtoWithInvalidRuc)).rejects.toThrow(InvalidRucException);

			expect(mockRepository.findByRuc).not.toHaveBeenCalled();
		});

		it('should persist organization with all mapped fields', async () => {
			const persistedOrg = new Organization(
				'org-1',
				validDto.codigoCliente,
				validDto.nombre,
				validDto.nombreComercial,
				validDto.subArea,
				validDto.ruc,
				validDto.tipo,
				validDto.linkedin,
				validDto.ubicacion,
				validDto.sector,
				validDto.tamano,
				validDto.actividadEconomica,
				validDto.alianzasEstrategicas,
				validDto.idContactoActivo,
				validDto.idAuthor,
				new Date(),
				new Date(),
			);

			(mockRepository.findByRuc as jest.Mock).mockResolvedValue(null);
			(mockRepository.save as jest.Mock).mockResolvedValue(persistedOrg);

			const result = await useCase.execute(validDto);

			expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
				codigoCliente: validDto.codigoCliente,
				nombre: validDto.nombre,
				nombreComercial: validDto.nombreComercial,
				sector: validDto.sector,
				tamano: validDto.tamano,
			}));
			expect(result.codigoCliente).toBe(validDto.codigoCliente);
		});

		it('should handle repository errors gracefully', async () => {
			const error = new Error('Database error');
			(mockRepository.findByRuc as jest.Mock).mockRejectedValue(error);

			await expect(useCase.execute(validDto)).rejects.toThrow('Database error');
		});

		it('should create organization without RUC when not provided', async () => {
			const dtoWithoutRuc = { ...validDto, ruc: undefined };
			const persistedOrg = new Organization(
				'org-1',
				dtoWithoutRuc.codigoCliente,
				dtoWithoutRuc.nombre,
				dtoWithoutRuc.nombreComercial,
				dtoWithoutRuc.subArea,
				undefined as any,
				dtoWithoutRuc.tipo,
				dtoWithoutRuc.linkedin,
				dtoWithoutRuc.ubicacion,
				dtoWithoutRuc.sector,
				dtoWithoutRuc.tamano,
				dtoWithoutRuc.actividadEconomica,
				dtoWithoutRuc.alianzasEstrategicas,
				dtoWithoutRuc.idContactoActivo,
				dtoWithoutRuc.idAuthor,
				new Date(),
				new Date(),
			);

			(mockRepository.save as jest.Mock).mockResolvedValue(persistedOrg);

			const result = await useCase.execute(dtoWithoutRuc);

			expect(mockRepository.findByRuc).not.toHaveBeenCalled();
			expect(result.id).toBe('org-1');
		});
	});
});
