import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@/modules/common/redis/redis.module';

import { DataExportController } from './infrastructure/http/data-export.controller';
import { DataImportController } from './infrastructure/http/data-import.controller';

import { ExceljsWorkbookBuilder } from './infrastructure/excel/exceljs-workbook.builder';
import { ExceljsReader } from './infrastructure/excel/exceljs-reader.adapter';
import { PrismaCrmReadRepository } from './infrastructure/persistence/prisma-crm-read.repository';
import { PrismaCrmImportRepository } from './infrastructure/persistence/prisma-crm-import.repository';
import { ImportPublisher } from './infrastructure/queue/import.publisher';
import { ImportProcessor } from './infrastructure/queue/import.processor';
import { DATA_IMPORT_QUEUE } from './infrastructure/queue/import-queue.constants';

import { WORKBOOK_BUILDER } from './domain/ports/workbook-builder.port';
import { EXCEL_READER } from './domain/ports/excel-reader.port';
import { CRM_READ_REPOSITORY } from './domain/ports/crm-read.repository';
import { CRM_IMPORT_REPOSITORY } from './domain/ports/crm-import.repository';

import { ImportPlannerService } from './application/services/import-planner.service';
import { ExportWorkbookUseCase } from './application/use-cases/export-workbook.use-case';
import { ValidateImportUseCase } from './application/use-cases/validate-import.use-case';
import { CommitImportUseCase } from './application/use-cases/commit-import.use-case';
import { GenerateTemplateUseCase } from './application/use-cases/generate-template.use-case';

@Module({
    imports: [
        RedisModule,
        BullModule.registerQueue({ name: DATA_IMPORT_QUEUE }),
    ],
    controllers: [DataExportController, DataImportController],
    providers: [
        // Adapters de Excel
        ExceljsWorkbookBuilder,
        ExceljsReader,
        { provide: WORKBOOK_BUILDER, useExisting: ExceljsWorkbookBuilder },
        { provide: EXCEL_READER, useExisting: ExceljsReader },

        // Repositorios
        PrismaCrmReadRepository,
        PrismaCrmImportRepository,
        { provide: CRM_READ_REPOSITORY, useExisting: PrismaCrmReadRepository },
        {
            provide: CRM_IMPORT_REPOSITORY,
            useExisting: PrismaCrmImportRepository,
        },

        // Servicios / use-cases
        ImportPlannerService,
        ExportWorkbookUseCase,
        ValidateImportUseCase,
        CommitImportUseCase,
        GenerateTemplateUseCase,

        // Cola de importación asíncrona
        ImportPublisher,
        ImportProcessor,
    ],
})
export class DataManagementModule {}
