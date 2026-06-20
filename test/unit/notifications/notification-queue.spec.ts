import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NotificationProcessor } from '@/modules/notifications/infrastructure/queue/notification.processor';
import { StaleLeadAlertProcessor } from '@/modules/notifications/infrastructure/queue/stale-lead-alert.processor';
import { StaleLeadAlertScheduler } from '@/modules/notifications/infrastructure/queue/stale-lead-alert.scheduler';
import {
    NotificationSchedulerPublisher,
    SEND_INTERNAL_JOB,
    SEND_INSTANCE_INTERNAL_JOB,
    SEND_INSTANCE_EXTERNAL_JOB,
} from '@/modules/notifications/infrastructure/queue/notification-scheduler.publisher';
import { GENERATE_STALE_LEAD_ALERTS_JOB } from '@/modules/notifications/infrastructure/queue/stale-lead-alert.scheduler';
import { Queue } from 'bullmq';

describe('Notifications queue', () => {
    const makeJob = (name: string, data: any = {}) => ({ name, data }) as any;

    describe('NotificationProcessor', () => {
        let sendInternal: any;
        let sendInstanceInternal: any;
        let sendInstanceExternal: any;
        let processor: NotificationProcessor;

        beforeEach(() => {
            sendInternal = { execute: jest.fn() };
            sendInstanceInternal = { execute: jest.fn() };
            sendInstanceExternal = { execute: jest.fn() };
            processor = new NotificationProcessor(
                sendInternal,
                sendInstanceInternal,
                sendInstanceExternal,
            );
        });

        it('dispatches send-internal job', async () => {
            await processor.process(
                makeJob(SEND_INTERNAL_JOB, { notificationId: 7 }),
            );

            expect(sendInternal.execute).toHaveBeenCalledWith(7);
            expect(sendInstanceInternal.execute).not.toHaveBeenCalled();
            expect(sendInstanceExternal.execute).not.toHaveBeenCalled();
        });

        it('dispatches send-instance-internal job', async () => {
            await processor.process(
                makeJob(SEND_INSTANCE_INTERNAL_JOB, { instanciaId: 3 }),
            );

            expect(sendInstanceInternal.execute).toHaveBeenCalledWith(3);
            expect(sendInternal.execute).not.toHaveBeenCalled();
        });

        it('dispatches send-instance-external job', async () => {
            await processor.process(
                makeJob(SEND_INSTANCE_EXTERNAL_JOB, { instanciaId: 9 }),
            );

            expect(sendInstanceExternal.execute).toHaveBeenCalledWith(9);
        });

        it('warns and does nothing for an unknown job name', async () => {
            const warn = jest
                .spyOn((processor as any).logger, 'warn')
                .mockImplementation(() => undefined);

            await processor.process(makeJob('unknown-job', {}));

            expect(warn).toHaveBeenCalled();
            expect(sendInternal.execute).not.toHaveBeenCalled();
            expect(sendInstanceInternal.execute).not.toHaveBeenCalled();
            expect(sendInstanceExternal.execute).not.toHaveBeenCalled();
        });
    });

    describe('StaleLeadAlertProcessor', () => {
        let generate: any;
        let processor: StaleLeadAlertProcessor;

        beforeEach(() => {
            generate = { execute: jest.fn() };
            processor = new StaleLeadAlertProcessor(generate);
        });

        it('runs the use case for the matching job name', async () => {
            await processor.process(makeJob(GENERATE_STALE_LEAD_ALERTS_JOB));

            expect(generate.execute).toHaveBeenCalledTimes(1);
        });

        it('does nothing for a non-matching job name', async () => {
            await processor.process(makeJob('other-job'));

            expect(generate.execute).not.toHaveBeenCalled();
        });
    });

    describe('StaleLeadAlertScheduler', () => {
        let mockQueue: jest.Mocked<Queue>;
        let scheduler: StaleLeadAlertScheduler;

        beforeEach(() => {
            mockQueue = {
                upsertJobScheduler: jest.fn(),
            } as unknown as jest.Mocked<Queue>;
            scheduler = new StaleLeadAlertScheduler(mockQueue);
        });

        it('registers the daily repeatable job on module init', async () => {
            (mockQueue.upsertJobScheduler as any).mockResolvedValue(undefined);
            const log = jest
                .spyOn((scheduler as any).logger, 'log')
                .mockImplementation(() => undefined);

            await scheduler.onModuleInit();

            expect(mockQueue.upsertJobScheduler).toHaveBeenCalledWith(
                'stale-lead-alert-daily',
                { pattern: '0 9 * * *' },
                { name: GENERATE_STALE_LEAD_ALERTS_JOB },
            );
            expect(log).toHaveBeenCalled();
        });

        it('swallows Error failures and logs the message', async () => {
            (mockQueue.upsertJobScheduler as any).mockRejectedValue(
                new Error('redis down'),
            );
            const error = jest
                .spyOn((scheduler as any).logger, 'error')
                .mockImplementation(() => undefined);

            await expect(scheduler.onModuleInit()).resolves.toBeUndefined();

            expect(error).toHaveBeenCalledWith(
                expect.stringContaining('redis down'),
            );
        });

        it('swallows non-Error failures with a default message', async () => {
            (mockQueue.upsertJobScheduler as any).mockRejectedValue('boom');
            const error = jest
                .spyOn((scheduler as any).logger, 'error')
                .mockImplementation(() => undefined);

            await expect(scheduler.onModuleInit()).resolves.toBeUndefined();

            expect(error).toHaveBeenCalledWith(
                expect.stringContaining('error desconocido'),
            );
        });
    });

    describe('NotificationSchedulerPublisher', () => {
        let mockQueue: jest.Mocked<Queue>;
        let publisher: NotificationSchedulerPublisher;

        beforeEach(() => {
            mockQueue = {
                add: jest.fn(),
                remove: jest.fn(),
            } as unknown as jest.Mocked<Queue>;
            publisher = new NotificationSchedulerPublisher(mockQueue);
        });

        it('schedules an internal notification with a future delay', async () => {
            const sendAt = new Date(Date.now() + 3600000);

            const jobId = await publisher.scheduleInternal({
                notificationId: 42,
                sendAt,
            });

            expect(jobId).toBe('notif-internal-42');
            expect(mockQueue.add).toHaveBeenCalledWith(
                SEND_INTERNAL_JOB,
                { notificationId: 42 },
                expect.objectContaining({
                    jobId: 'notif-internal-42',
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 60_000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                }),
            );
            const opts = (mockQueue.add as any).mock.calls[0][2];
            expect(opts.delay).toBeGreaterThan(0);
        });

        it('clamps the delay to 0 when sendAt is in the past', async () => {
            const sendAt = new Date(Date.now() - 3600000);

            await publisher.scheduleInstanceInternal({
                instanciaId: 5,
                sendAt,
            });

            expect(mockQueue.add).toHaveBeenCalledWith(
                SEND_INSTANCE_INTERNAL_JOB,
                { instanciaId: 5 },
                expect.objectContaining({
                    jobId: 'seg-internal-5',
                    delay: 0,
                }),
            );
        });

        it('schedules an instance external notification', async () => {
            const jobId = await publisher.scheduleInstanceExternal({
                instanciaId: 8,
                sendAt: new Date(Date.now() + 1000),
            });

            expect(jobId).toBe('seg-external-8');
            expect(mockQueue.add).toHaveBeenCalledWith(
                SEND_INSTANCE_EXTERNAL_JOB,
                { instanciaId: 8 },
                expect.objectContaining({ jobId: 'seg-external-8' }),
            );
        });

        it('removes a job on cancel', async () => {
            await publisher.cancel('seg-external-8');

            expect(mockQueue.remove).toHaveBeenCalledWith('seg-external-8');
        });
    });
});
