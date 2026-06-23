import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { CommitImportUseCase } from '@/modules/data-management/application/use-cases/commit-import.use-case';
import {
    DATA_IMPORT_QUEUE,
    DATA_IMPORT_JOB,
    ImportJobData,
} from '@/modules/data-management/infrastructure/queue/import-queue.constants';
import { RowIssue } from '@/modules/data-management/application/dto/import-types';
import {
    IN_APP_NOTIFICATION_REPOSITORY,
    type InAppNotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/in-app-notification-repository.port';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationStatus } from '@/modules/notifications/domain/enums/in-app-notification-status';

@Processor(DATA_IMPORT_QUEUE)
export class ImportProcessor extends WorkerHost {
    private readonly logger = new Logger(ImportProcessor.name);

    constructor(
        private readonly commitImportUseCase: CommitImportUseCase,
        @Inject(IN_APP_NOTIFICATION_REPOSITORY)
        private readonly inAppRepo: InAppNotificationRepositoryPort,
    ) {
        super();
    }

    async process(job: Job<ImportJobData>): Promise<unknown> {
        if (job.name !== DATA_IMPORT_JOB) {
            return;
        }
        const buffer = Buffer.from(job.data.fileBase64, 'base64');
        const { filename, userId } = job.data;

        this.logger.log(
            `Procesando importación "${filename}" (job ${job.id})`,
        );

        let result;
        try {
            result = await this.commitImportUseCase.execute(buffer, userId);
        } catch (err) {
            this.logger.error(
                `Importación job ${job.id} falló con excepción`,
                err,
            );
            await this.sendNotification(
                userId,
                'Error de importación',
                `Error inesperado al importar "${filename}". Los cambios fueron revertidos automáticamente.`,
            );
            throw err;
        }

        if (!result.valid) {
            await this.sendNotification(
                userId,
                'Error de importación',
                this.buildValidationMessage(filename, result.validation.errors),
            );
        } else {
            this.logger.log(
                `Importación job ${job.id}: ` +
                    `insertados=${JSON.stringify(result.summary?.inserted ?? {})}`,
            );
        }

        return result;
    }

    private buildValidationMessage(filename: string, errors: RowIssue[]): string {
        const MAX_SHOWN = 10;
        const total = errors.length;
        const shown = errors.slice(0, MAX_SHOWN);
        const rest = total - shown.length;

        const lines = shown.map(
            (e) => `• [${e.sheet} · fila ${e.row}] ${e.message}`,
        );
        if (rest > 0) {
            lines.push(
                `...y ${rest} error${rest !== 1 ? 'es' : ''} más. Usa el validador para ver el detalle completo.`,
            );
        }

        return [
            `Se detectaron ${total} error${total !== 1 ? 'es' : ''} en "${filename}". Los datos no fueron importados.`,
            '',
            ...lines,
        ].join('\n');
    }

    private async sendNotification(
        userId: number,
        titulo: string,
        mensaje: string,
    ): Promise<void> {
        try {
            await this.inAppRepo.create(
                new InAppNotification(
                    null,
                    titulo,
                    mensaje,
                    InAppNotificationStatus.NO_LEIDA,
                    userId,
                    null,
                    null,
                    new Date(),
                ),
            );
        } catch (notifyErr) {
            this.logger.error(
                'No se pudo crear la notificación in-app de error de importación',
                notifyErr,
            );
        }
    }
}
