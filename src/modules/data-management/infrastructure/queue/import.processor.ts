import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CommitImportUseCase } from '@/modules/data-management/application/use-cases/commit-import.use-case';
import {
    DATA_IMPORT_QUEUE,
    DATA_IMPORT_JOB,
    ImportJobData,
} from '@/modules/data-management/infrastructure/queue/import-queue.constants';

@Processor(DATA_IMPORT_QUEUE)
export class ImportProcessor extends WorkerHost {
    private readonly logger = new Logger(ImportProcessor.name);

    constructor(private readonly commitImportUseCase: CommitImportUseCase) {
        super();
    }

    async process(job: Job<ImportJobData>): Promise<unknown> {
        if (job.name !== DATA_IMPORT_JOB) {
            return;
        }
        const buffer = Buffer.from(job.data.fileBase64, 'base64');
        this.logger.log(
            `Procesando importación "${job.data.filename}" (job ${job.id})`,
        );
        const result = await this.commitImportUseCase.execute(
            buffer,
            job.data.userId,
        );
        this.logger.log(
            `Importación job ${job.id}: válida=${result.valid}, ` +
                `insertados=${JSON.stringify(result.summary?.inserted ?? {})}`,
        );
        // El valor retornado se guarda como returnvalue del job y se consulta
        // desde GET /data/import/jobs/:id.
        return result;
    }
}
