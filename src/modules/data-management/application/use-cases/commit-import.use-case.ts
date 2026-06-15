import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    EXCEL_READER,
    type IExcelReader,
} from '@/modules/data-management/domain/ports/excel-reader.port';
import {
    CRM_IMPORT_REPOSITORY,
    type IImportCommitRepository,
} from '@/modules/data-management/domain/ports/crm-import.repository';
import { ImportPlannerService } from '@/modules/data-management/application/services/import-planner.service';
import {
    ImportSummary,
    ImportValidation,
} from '@/modules/data-management/application/dto/import-types';

export interface CommitImportResult {
    valid: boolean;
    validation: ImportValidation;
    /** Resumen de inserción; `null` si la validación bloqueó la importación. */
    summary: ImportSummary | null;
}

export class CommitImportUseCase {
    constructor(
        @Inject(EXCEL_READER)
        private readonly excelReader: IExcelReader,
        private readonly planner: ImportPlannerService,
        @Inject(CRM_IMPORT_REPOSITORY)
        private readonly importRepository: IImportCommitRepository,
    ) {}

    async execute(
        buffer: Buffer,
        authorUserId: number,
    ): Promise<CommitImportResult> {
        const workbook = await this.excelReader.read(buffer);
        const { plan, validation } = this.planner.plan(workbook);

        // Insert-only y atómico: si hay errores estructurales/de enum bloqueantes,
        // no se inserta nada y se devuelven los errores para corregir el archivo.
        if (!validation.valid) {
            return { valid: false, validation, summary: null };
        }

        const summary = await this.importRepository.commit(plan, {
            authorUserId,
        });
        return { valid: true, validation, summary };
    }
}
