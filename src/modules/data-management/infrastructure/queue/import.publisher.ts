import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    DATA_IMPORT_QUEUE,
    DATA_IMPORT_JOB,
    ImportJobData,
} from '@/modules/data-management/infrastructure/queue/import-queue.constants';

@Injectable()
export class ImportPublisher {
    constructor(
        @InjectQueue(DATA_IMPORT_QUEUE) private readonly queue: Queue,
    ) {}

    /** Encola una importación para procesarla en segundo plano. Devuelve el jobId. */
    async enqueue(data: ImportJobData): Promise<string> {
        const job = await this.queue.add(DATA_IMPORT_JOB, data, {
            attempts: 1, // la importación es transaccional; no reintentar a ciegas
            removeOnComplete: { age: 86_400 }, // conserva resultados 24h para consultarlos
            removeOnFail: { age: 86_400 },
        });
        return String(job.id);
    }

    getQueue(): Queue {
        return this.queue;
    }
}
