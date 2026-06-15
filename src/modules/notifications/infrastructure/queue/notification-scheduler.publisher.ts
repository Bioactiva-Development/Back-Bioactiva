import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationSchedulerPort } from '@/modules/notifications/domain/ports/notification-scheduler.port';

export const NOTIFICATIONS_QUEUE = 'NOTIFICATIONS_QUEUE';

export const SEND_INTERNAL_JOB = 'send-internal';
export const SEND_INSTANCE_INTERNAL_JOB = 'send-instance-internal';
export const SEND_INSTANCE_EXTERNAL_JOB = 'send-instance-external';

@Injectable()
export class NotificationSchedulerPublisher implements NotificationSchedulerPort {
    constructor(
        @InjectQueue(NOTIFICATIONS_QUEUE)
        private readonly queue: Queue,
    ) {}

    async scheduleInternal(input: {
        notificationId: number;
        sendAt: Date;
    }): Promise<string> {
        return this.schedule(
            SEND_INTERNAL_JOB,
            `notif-internal-${input.notificationId}`,
            { notificationId: input.notificationId },
            input.sendAt,
        );
    }

    async scheduleInstanceInternal(input: {
        instanciaId: number;
        sendAt: Date;
    }): Promise<string> {
        return this.schedule(
            SEND_INSTANCE_INTERNAL_JOB,
            `seg-internal-${input.instanciaId}`,
            { instanciaId: input.instanciaId },
            input.sendAt,
        );
    }

    async scheduleInstanceExternal(input: {
        instanciaId: number;
        sendAt: Date;
    }): Promise<string> {
        return this.schedule(
            SEND_INSTANCE_EXTERNAL_JOB,
            `seg-external-${input.instanciaId}`,
            { instanciaId: input.instanciaId },
            input.sendAt,
        );
    }

    async cancel(jobId: string): Promise<void> {
        await this.queue.remove(jobId);
    }

    private async schedule(
        jobName: string,
        jobId: string,
        data: Record<string, number>,
        sendAt: Date,
    ): Promise<string> {
        const delay = Math.max(0, sendAt.getTime() - Date.now());

        await this.queue.add(jobName, data, {
            jobId,
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 60_000 },
            removeOnComplete: true,
            removeOnFail: false,
        });

        return jobId;
    }
}
