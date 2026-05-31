import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { QuerySunatUseCase } from '@/modules/organizations/application/use-cases/query-sunat.use-case';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';

describe('Organizations module', () => {
	describe('QuerySunatUseCase', () => {
		let useCase: QuerySunatUseCase;
		let mockSunatService: any;

		beforeEach(() => {
			mockSunatService = {
				getByRuc: jest.fn(),
				getByRazonSocial: jest.fn(),
			};
			useCase = new QuerySunatUseCase(mockSunatService);
		});

		it('should query by RUC when input is 11 digits', async () => {
			const companyInfo = {
				ruc: '20123456789',
				razonSocial: 'Tech Corp',
				nombreComercial: 'Tech',
				tipo: EnterpriseType.EMPRESA_NACIONAL,
				ubicacion: 'Lima',
				actividadEconomica: 'Software',
				tamano: Size.GRANDE,
				sector: Sector.TECNOLOGIA,
			};
			mockSunatService.getByRuc.mockResolvedValue(companyInfo);

			const result = await useCase.execute('20123456789');

			expect(result).toEqual(companyInfo);
			expect(mockSunatService.getByRuc).toHaveBeenCalledWith('20123456789');
			expect(mockSunatService.getByRazonSocial).not.toHaveBeenCalled();
		});

		it('should query by business name when input is not 11 digits', async () => {
			const companies = [
				{ ruc: '20123456789', razonSocial: 'Tech Corp', nombreComercial: 'Tech', tipo: EnterpriseType.EMPRESA_NACIONAL, ubicacion: null, actividadEconomica: null, tamano: Size.PEQUENO, sector: null },
			];
			mockSunatService.getByRazonSocial.mockResolvedValue(companies);

			const result = await useCase.execute('Tech Corp');

			expect(result).toEqual(companies);
			expect(mockSunatService.getByRazonSocial).toHaveBeenCalledWith('Tech Corp');
			expect(mockSunatService.getByRuc).not.toHaveBeenCalled();
		});

		it('should handle 11-digit input that contains letters by querying by name', async () => {
			mockSunatService.getByRazonSocial.mockResolvedValue([]);

			const result = await useCase.execute('2012345678a');

			expect(result).toEqual([]);
			expect(mockSunatService.getByRazonSocial).toHaveBeenCalled();
		});

		it('should propagate service errors', async () => {
			mockSunatService.getByRazonSocial.mockRejectedValue(new Error('SUNAT unavailable'));

			await expect(useCase.execute('Tech Corp')).rejects.toThrow('SUNAT unavailable');
		});
	});
});
