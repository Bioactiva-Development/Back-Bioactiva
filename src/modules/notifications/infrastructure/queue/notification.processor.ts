import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SendInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-internal-email.use-case';
import { SendInstanceInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-instance-internal-email.use-case';
import { SendInstanceExternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-instance-external-email.use-case';
import {
    NOTIFICATIONS_QUEUE,
    SEND_INSTANCE_EXTERNAL_JOB,
    SEND_INSTANCE_INTERNAL_JOB,
    SEND_INTERNAL_JOB,
} from '@/modules/notifications/infrastructure/queue/notification-scheduler.publisher';

@Injectable()
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly sendInternalEmailUseCase: SendInternalEmailUseCase,
        private readonly sendInstanceInternalEmailUseCase: SendInstanceInternalEmailUseCase,
        private readonly sendInstanceExternalEmailUseCase: SendInstanceExternalEmailUseCase,
    ) {
        super();
    }

    async process(
        job: Job<{ notificationId?: number; instanciaId?: number }>,
    ): Promise<void> {
        if (job.name === SEND_INTERNAL_JOB) {
            await this.sendInternalEmailUseCase.execute(
                job.data.notificationId!,
            );
            return;
        }

        if (job.name === SEND_INSTANCE_INTERNAL_JOB) {
            await this.sendInstanceInternalEmailUseCase.execute(
                job.data.instanciaId!,
            );
            return;
        }

        if (job.name === SEND_INSTANCE_EXTERNAL_JOB) {
            await this.sendInstanceExternalEmailUseCase.execute(
                job.data.instanciaId!,
            );
            return;
        }

        this.logger.warn(`Job de notificación desconocido: ${job.name}`);
    }
}
