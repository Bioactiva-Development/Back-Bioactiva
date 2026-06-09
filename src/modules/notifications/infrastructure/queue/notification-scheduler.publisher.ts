import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationSchedulerPort } from '@/modules/notifications/domain/ports/notification-scheduler.port';

export const NOTIFICATIONS_QUEUE = 'NOTIFICATIONS_QUEUE';

export const SEND_INTERNAL_JOB = 'send-internal';
export const SEND_EXTERNAL_JOB = 'send-external';

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
            input.notificationId,
            input.sendAt,
        );
    }

    async scheduleExternal(input: {
        notificationId: number;
        sendAt: Date;
    }): Promise<string> {
        return this.schedule(
            SEND_EXTERNAL_JOB,
            `notif-external-${input.notificationId}`,
            input.notificationId,
            input.sendAt,
        );
    }

    async cancel(jobId: string): Promise<void> {
        await this.queue.remove(jobId);
    }

    private async schedule(
        jobName: string,
        jobId: string,
        notificationId: number,
        sendAt: Date,
    ): Promise<string> {
        const delay = Math.max(0, sendAt.getTime() - Date.now());

        await this.queue.add(
            jobName,
            { notificationId },
            {
                jobId,
                delay,
                attempts: 3,
                backoff: { type: 'exponential', delay: 60_000 },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );

        return jobId;
    }
}
