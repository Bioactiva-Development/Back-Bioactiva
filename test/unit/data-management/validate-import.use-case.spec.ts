import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ValidateImportUseCase } from '@/modules/data-management/application/use-cases/validate-import.use-case';
import { ImportPlannerService } from '@/modules/data-management/application/services/import-planner.service';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
import { ImportValidation } from '@/modules/data-management/application/dto/import-types';

describe('Data management module', () => {
    describe('ValidateImportUseCase', () => {
        let useCase: ValidateImportUseCase;
        let excelReader: any;
        let planner: ImportPlannerService;

        const sampleValidation = (): ImportValidation => ({
            valid: true,
            errors: [],
            warnings: [],
            parsedCounts: {
                organizaciones: 1,
                contactos: 0,
                leads: 0,
                cotizaciones: 0,
            },
        });

        beforeEach(() => {
            excelReader = { read: jest.fn() };
            planner = new ImportPlannerService({
                timeZone: 'America/Lima',
            } as unknown as AppTimeConfig);
            useCase = new ValidateImportUseCase(excelReader, planner);
        });

        it('reads the buffer and returns the validation from the plan', async () => {
            const workbook = { Organizaciones: [] };
            excelReader.read.mockResolvedValue(workbook);
            const validation = sampleValidation();
            const planSpy = jest
                .spyOn(planner, 'plan')
                .mockReturnValue({ plan: {} as any, validation });

            const buffer = Buffer.from('xlsx');
            const result = await useCase.execute(buffer);

            expect(excelReader.read).toHaveBeenCalledWith(buffer);
            expect(planSpy).toHaveBeenCalledWith(workbook);
            expect(result).toBe(validation);
        });
    });
});
