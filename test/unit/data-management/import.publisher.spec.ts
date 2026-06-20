import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ImportPublisher } from '@/modules/data-management/infrastructure/queue/import.publisher';
import {
    DATA_IMPORT_JOB,
    ImportJobData,
} from '@/modules/data-management/infrastructure/queue/import-queue.constants';

describe('Data management module', () => {
    describe('ImportPublisher', () => {
        let publisher: ImportPublisher;
        let queue: any;

        beforeEach(() => {
            queue = { add: jest.fn() };
            publisher = new ImportPublisher(queue);
        });

        it('enqueues a job with the import options and returns the jobId as string', async () => {
            queue.add.mockResolvedValue({ id: 777 });
            const data: ImportJobData = {
                fileBase64: 'YmFzZTY0',
                filename: 'crm.xlsx',
                userId: 3,
            };

            const jobId = await publisher.enqueue(data);

            expect(queue.add).toHaveBeenCalledWith(DATA_IMPORT_JOB, data, {
                attempts: 1,
                removeOnComplete: { age: 86_400 },
                removeOnFail: { age: 86_400 },
            });
            expect(jobId).toBe('777');
        });

        it('exposes the underlying queue', () => {
            expect(publisher.getQueue()).toBe(queue);
        });
    });
});
