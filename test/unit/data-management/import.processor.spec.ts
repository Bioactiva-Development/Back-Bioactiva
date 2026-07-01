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

        it('logs an empty insertion summary when the result summary has no inserted field', async () => {
            const loggerSpy = jest
                .spyOn((processor as any).logger, 'log')
                .mockImplementation(() => undefined);
            commitImport.execute.mockResolvedValue({
                valid: true,
                validation: {} as any,
                summary: {},
            });

            await processor.process(job());

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.stringContaining('insertados={}'),
            );
        });

        it('ignores jobs with a different name', async () => {
            const out = await processor.process(job({ name: 'other-job' }));

            expect(out).toBeUndefined();
            expect(commitImport.execute).not.toHaveBeenCalled();
        });

        it('notifies the user and rethrows when the commit throws', async () => {
            const error = new Error('DB down');
            commitImport.execute.mockRejectedValue(error);

            await expect(processor.process(job())).rejects.toThrow(error);

            expect(inAppRepo.create).toHaveBeenCalledTimes(1);
            const notification = inAppRepo.create.mock.calls[0][0];
            expect(notification.titulo).toBe('Error de importación');
            expect(notification.mensaje).toContain(
                'Error inesperado al importar "crm.xlsx"',
            );
        });

        it('swallows errors raised while creating the in-app notification', async () => {
            const error = new Error('DB down');
            commitImport.execute.mockRejectedValue(error);
            inAppRepo.create.mockRejectedValue(new Error('notify failed'));

            await expect(processor.process(job())).rejects.toThrow(error);
        });

        it('builds a validation message listing only the first errors and a "more" summary', async () => {
            const errors = Array.from({ length: 12 }, (_, i) => ({
                sheet: 'Organizaciones',
                row: i + 2,
                message: `error ${i}`,
            }));
            commitImport.execute.mockResolvedValue({
                valid: false,
                validation: { errors },
                summary: null,
            });

            await processor.process(job());

            const notification = inAppRepo.create.mock.calls[0][0];
            expect(notification.mensaje).toContain(
                'Se detectaron 12 errores en "crm.xlsx"',
            );
            expect(notification.mensaje).toContain('...y 2 errores más');
            expect(notification.mensaje).not.toContain('error 10');
        });

        it('uses singular wording when there is exactly one error and one remaining', async () => {
            const errors = Array.from({ length: 11 }, (_, i) => ({
                sheet: 'Organizaciones',
                row: i + 2,
                message: `error ${i}`,
            }));
            commitImport.execute.mockResolvedValue({
                valid: false,
                validation: { errors },
                summary: null,
            });

            await processor.process(job());

            const notification = inAppRepo.create.mock.calls[0][0];
            expect(notification.mensaje).toContain('...y 1 error más');
        });

        it('uses singular wording in the header when there is a single validation error', async () => {
            commitImport.execute.mockResolvedValue({
                valid: false,
                validation: {
                    errors: [
                        { sheet: 'Organizaciones', row: 2, message: 'bad' },
                    ],
                },
                summary: null,
            });

            await processor.process(job());

            const notification = inAppRepo.create.mock.calls[0][0];
            expect(notification.mensaje).toContain(
                'Se detectaron 1 error en "crm.xlsx"',
            );
        });
    });
});
