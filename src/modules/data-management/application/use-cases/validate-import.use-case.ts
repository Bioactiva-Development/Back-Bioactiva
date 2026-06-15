import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    EXCEL_READER,
    type IExcelReader,
} from '@/modules/data-management/domain/ports/excel-reader.port';
import { ImportPlannerService } from '@/modules/data-management/application/services/import-planner.service';
import { ImportValidation } from '@/modules/data-management/application/dto/import-types';

export class ValidateImportUseCase {
    constructor(
        @Inject(EXCEL_READER)
        private readonly excelReader: IExcelReader,
        private readonly planner: ImportPlannerService,
    ) {}

    /** Dry-run: parsea y valida sin escribir nada en la BD. */
    async execute(buffer: Buffer): Promise<ImportValidation> {
        const workbook = await this.excelReader.read(buffer);
        const { validation } = this.planner.plan(workbook);
        return validation;
    }
}
