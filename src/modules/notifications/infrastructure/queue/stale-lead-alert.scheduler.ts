import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const STALE_LEAD_ALERTS_QUEUE = 'STALE_LEAD_ALERTS_QUEUE';
export const GENERATE_STALE_LEAD_ALERTS_JOB = 'generate-stale-lead-alerts';

/**
 * Registra el job repetible diario (09:00, horario laboral) que dispara la
 * revisión de leads estancados. `upsertJobScheduler` es idempotente, así que
 * reinicios de la app no duplican la programación.
 */
@Injectable()
export class StaleLeadAlertScheduler implements OnModuleInit {
    private readonly logger = new Logger(StaleLeadAlertScheduler.name);

    constructor(
        @InjectQueue(STALE_LEAD_ALERTS_QUEUE)
        private readonly queue: Queue,
    ) {}

    async onModuleInit(): Promise<void> {
        // El registro del cron NUNCA debe tumbar el arranque de la app: si Redis
        // no está disponible en el boot, se registra el error y se continúa (la
        // app queda operativa; el job puede registrarse en un arranque posterior).
        try {
            await this.queue.upsertJobScheduler(
                'stale-lead-alert-daily',
                { pattern: '0 9 * * *' },
                { name: GENERATE_STALE_LEAD_ALERTS_JOB },
            );
            this.logger.log(
                'Job diario de alerta de leads estancados registrado',
            );
        } catch (error) {
            this.logger.error(
                `No se pudo registrar el job de alerta de leads estancados: ${
                    error instanceof Error ? error.message : 'error desconocido'
                }`,
            );
        }
    }
}
