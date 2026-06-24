import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ImportProcessor } from '@/modules/data-management/infrastructure/queue/import.processor';
import { DATA_IMPORT_JOB } from '@/modules/data-management/infrastructure/queue/import-queue.constants';

describe('Data management module', () => {
    describe('ImportProcessor', () => {
        let processor: ImportProcessor;
        let commitImport: any;
        let inAppRepo: any;

        beforeEach(() => {
            commitImport = { execute: jest.fn() };
            inAppRepo = { create: jest.fn().mockResolvedValue(undefined) };
            processor = new ImportProcessor(commitImport, inAppRepo);
        });

        const job = (over: Partial<any> = {}): any => ({
            id: 'job-1',
            name: DATA_IMPORT_JOB,
            data: {
                fileBase64: Buffer.from('hello').toString('base64'),
                filename: 'crm.xlsx',
                userId: 9,
            },
            ...over,
        });

        it('decodes the file and commits the import', async () => {
            const result = {
                valid: true,
                validation: {} as any,
                summary: { inserted: { organizaciones: 3 } },
            };
            commitImport.execute.mockResolvedValue(result);

            const out = await processor.process(job());

            expect(commitImport.execute).toHaveBeenCalledTimes(1);
            const [bufferArg, userIdArg] =
                commitImport.execute.mock.calls[0];
            expect(Buffer.isBuffer(bufferArg)).toBe(true);
            expect(bufferArg.toString()).toBe('hello');
            expect(userIdArg).toBe(9);
            expect(out).toBe(result);
        });

        it('handles a summary with no inserted counts', async () => {
            commitImport.execute.mockResolvedValue({
                valid: false,
                validation: { errors: [] } as any,
                summary: null,
            });

            const out = await processor.process(job());

            expect(out).toEqual({
                valid: false,
                validation: { errors: [] },
                summary: null,
            });
        });

        it('ignores jobs with a different name', async () => {
            const out = await processor.process(job({ name: 'other-job' }));

            expect(out).toBeUndefined();
            expect(commitImport.execute).not.toHaveBeenCalled();
        });
    });
});
