import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CommitImportUseCase } from '@/modules/data-management/application/use-cases/commit-import.use-case';
import { ImportPlannerService } from '@/modules/data-management/application/services/import-planner.service';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
import {
    ImportPlan,
    ImportSummary,
    ImportValidation,
} from '@/modules/data-management/application/dto/import-types';

describe('Data management module', () => {
    describe('CommitImportUseCase', () => {
        let useCase: CommitImportUseCase;
        let excelReader: any;
        let planner: ImportPlannerService;
        let importRepository: any;

        const emptyPlan = (): ImportPlan => ({
            organizaciones: [],
            contactos: [],
            leads: [],
            cotizaciones: [],
        });

        const validation = (valid: boolean): ImportValidation => ({
            valid,
            errors: valid
                ? []
                : [{ sheet: 'Organizaciones', row: 2, message: 'boom' }],
            warnings: [],
            parsedCounts: {
                organizaciones: 1,
                contactos: 0,
                leads: 0,
                cotizaciones: 0,
            },
        });

        const summary = (): ImportSummary => ({
            inserted: {
                organizaciones: 1,
                contactos: 0,
                leads: 0,
                actividades: 0,
                cotizaciones: 0,
            },
            skipped: [],
            warnings: [],
        });

        beforeEach(() => {
            excelReader = { read: jest.fn() };
            planner = new ImportPlannerService({
                timeZone: 'America/Lima',
            } as unknown as AppTimeConfig);
            importRepository = { commit: jest.fn() };
            useCase = new CommitImportUseCase(
                excelReader,
                planner,
                importRepository,
            );
        });

        it('commits the plan when validation passes', async () => {
            const workbook = { Organizaciones: [] };
            const plan = emptyPlan();
            excelReader.read.mockResolvedValue(workbook);
            jest.spyOn(planner, 'plan').mockReturnValue({
                plan,
                validation: validation(true),
            });
            const sum = summary();
            importRepository.commit.mockResolvedValue(sum);

            const buffer = Buffer.from('xlsx');
            const result = await useCase.execute(buffer, 42);

            expect(excelReader.read).toHaveBeenCalledWith(buffer);
            expect(importRepository.commit).toHaveBeenCalledWith(plan, {
                authorUserId: 42,
            });
            expect(result.valid).toBe(true);
            expect(result.summary).toBe(sum);
            expect(result.validation.valid).toBe(true);
        });

        it('returns invalid result without committing when validation fails', async () => {
            const workbook = { Organizaciones: [] };
            excelReader.read.mockResolvedValue(workbook);
            const val = validation(false);
            jest.spyOn(planner, 'plan').mockReturnValue({
                plan: emptyPlan(),
                validation: val,
            });

            const result = await useCase.execute(Buffer.from('xlsx'), 7);

            expect(importRepository.commit).not.toHaveBeenCalled();
            expect(result.valid).toBe(false);
            expect(result.summary).toBeNull();
            expect(result.validation).toBe(val);
        });
    });
});
