import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SendInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-internal-email.use-case';
import { SendExternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-external-email.use-case';
import {
    NOTIFICATIONS_QUEUE,
    SEND_EXTERNAL_JOB,
    SEND_INTERNAL_JOB,
} from '@/modules/notifications/infrastructure/queue/notification-scheduler.publisher';

@Injectable()
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly sendInternalEmailUseCase: SendInternalEmailUseCase,
        private readonly sendExternalEmailUseCase: SendExternalEmailUseCase,
    ) {
        super();
    }

    async process(job: Job<{ notificationId: number }>): Promise<void> {
        const { notificationId } = job.data;

        if (job.name === SEND_INTERNAL_JOB) {
            await this.sendInternalEmailUseCase.execute(notificationId);
            return;
        }

        if (job.name === SEND_EXTERNAL_JOB) {
            await this.sendExternalEmailUseCase.execute(notificationId);
            return;
        }

        this.logger.warn(`Job de notificación desconocido: ${job.name}`);
    }
}
