import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { GenerateStaleLeadAlertsUseCase } from '@/modules/notifications/application/use-cases/generate-stale-lead-alerts.use-case';
import {
    GENERATE_STALE_LEAD_ALERTS_JOB,
    STALE_LEAD_ALERTS_QUEUE,
} from '@/modules/notifications/infrastructure/queue/stale-lead-alert.scheduler';

@Injectable()
@Processor(STALE_LEAD_ALERTS_QUEUE)
export class StaleLeadAlertProcessor extends WorkerHost {
    constructor(
        private readonly generateStaleLeadAlertsUseCase: GenerateStaleLeadAlertsUseCase,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        if (job.name === GENERATE_STALE_LEAD_ALERTS_JOB) {
            await this.generateStaleLeadAlertsUseCase.execute();
        }
    }
}
