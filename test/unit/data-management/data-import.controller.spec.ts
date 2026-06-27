import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { DataImportController } from '@/modules/data-management/infrastructure/http/data-import.controller';
import { ValidateImportUseCase } from '@/modules/data-management/application/use-cases/validate-import.use-case';
import { GenerateTemplateUseCase } from '@/modules/data-management/application/use-cases/generate-template.use-case';
import { ImportPublisher } from '@/modules/data-management/infrastructure/queue/import.publisher';
import { User } from '@/modules/users/domain/entities/user';

const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

describe('Data management module', () => {
    describe('DataImportController', () => {
        let controller: DataImportController;
        let validateImport: any;
        let generateTemplate: any;
        let importPublisher: any;
        let queue: any;

        const file = (over: Partial<any> = {}): any => ({
            buffer: Buffer.from('file-bytes'),
            originalname: 'crm.xlsx',
            mimetype: XLSX_MIME,
            size: 10,
            ...over,
        });

        beforeEach(async () => {
            validateImport = { execute: jest.fn() };
            generateTemplate = { execute: jest.fn() };
            queue = { getJob: jest.fn() };
            importPublisher = {
                enqueue: jest.fn(),
                getQueue: jest.fn().mockReturnValue(queue),
            };

            const module = await Test.createTestingModule({
                controllers: [DataImportController],
                providers: [
                    {
                        provide: ValidateImportUseCase,
                        useValue: validateImport,
                    },
                    {
                        provide: GenerateTemplateUseCase,
                        useValue: generateTemplate,
                    },
                    {
                        provide: ImportPublisher,
                        useValue: importPublisher,
                    },
                ],
            }).compile();

            controller = module.get(DataImportController);
        });

        describe('template', () => {
            it('streams the generated template with headers', async () => {
                const buffer = Buffer.from('template-bytes');
                generateTemplate.execute.mockResolvedValue(buffer);
                const res: any = { set: jest.fn(), end: jest.fn() };

                await controller.template(res);

                expect(res.set).toHaveBeenCalledWith({
                    'Content-Type': XLSX_MIME,
                    'Content-Disposition':
                        'attachment; filename="plantilla_importacion_crm.xlsx"',
                    'Content-Length': String(buffer.length),
                });
                expect(res.end).toHaveBeenCalledWith(buffer);
            });
        });

        describe('validate', () => {
            it('validates an uploaded file', async () => {
                const validation = { valid: true };
                validateImport.execute.mockResolvedValue(validation);
                const f = file();

                const result = await controller.validate(f);

                expect(validateImport.execute).toHaveBeenCalledWith(f.buffer);
                expect(result).toBe(validation);
            });

            it('throws BadRequest when no file is attached', async () => {
                await expect(
                    controller.validate(undefined as any),
                ).rejects.toThrow(BadRequestException);
            });

            it('throws BadRequest when file size is 0', async () => {
                await expect(
                    controller.validate(file({ size: 0 })),
                ).rejects.toThrow(BadRequestException);
            });

            it('throws BadRequest when buffer is missing', async () => {
                await expect(
                    controller.validate(file({ buffer: undefined })),
                ).rejects.toThrow(BadRequestException);
            });
        });

        describe('commit', () => {
            const user = (id: number | null): User =>
                ({ id }) as unknown as User;

            it('enqueues the import and returns the jobId', async () => {
                importPublisher.enqueue.mockResolvedValue('job-123');
                const f = file();

                const result = await controller.commit(f, user(5));

                expect(importPublisher.enqueue).toHaveBeenCalledWith({
                    fileBase64: f.buffer.toString('base64'),
                    filename: 'crm.xlsx',
                    userId: 5,
                });
                expect(result).toEqual({ jobId: 'job-123' });
            });

            it('throws BadRequest when the file is invalid', async () => {
                await expect(
                    controller.commit(file({ size: 0 }), user(5)),
                ).rejects.toThrow(BadRequestException);
                expect(importPublisher.enqueue).not.toHaveBeenCalled();
            });

            it('throws BadRequest when the user is not identified', async () => {
                await expect(
                    controller.commit(file(), user(null)),
                ).rejects.toThrow(BadRequestException);
                expect(importPublisher.enqueue).not.toHaveBeenCalled();
            });

            it('throws BadRequest when the user is undefined', async () => {
                await expect(
                    controller.commit(file(), undefined as any),
                ).rejects.toThrow(BadRequestException);
            });
        });

        describe('jobStatus', () => {
            const currentUser = { id: 42 } as any;

            it('returns the job state and result when found', async () => {
                const job = {
                    id: 'job-7',
                    data: { userId: 42 },
                    progress: 50,
                    returnvalue: { valid: true },
                    failedReason: null,
                    getState: jest.fn().mockResolvedValue('completed'),
                };
                queue.getJob.mockResolvedValue(job);

                const result = await controller.jobStatus('job-7', currentUser);

                expect(queue.getJob).toHaveBeenCalledWith('job-7');
                expect(result).toEqual({
                    id: 'job-7',
                    state: 'completed',
                    progress: 50,
                    result: { valid: true },
                    failedReason: null,
                });
            });

            it('defaults result and failedReason to null when absent', async () => {
                const job = {
                    id: 'job-8',
                    data: { userId: 42 },
                    progress: 0,
                    returnvalue: undefined,
                    failedReason: undefined,
                    getState: jest.fn().mockResolvedValue('active'),
                };
                queue.getJob.mockResolvedValue(job);

                const result = await controller.jobStatus('job-8', currentUser);

                expect(result.result).toBeNull();
                expect(result.failedReason).toBeNull();
                expect(result.state).toBe('active');
            });

            it('throws NotFound when the job does not exist', async () => {
                queue.getJob.mockResolvedValue(null);

                await expect(
                    controller.jobStatus('missing', currentUser),
                ).rejects.toThrow(NotFoundException);
            });

            it('throws NotFound when the job belongs to another user', async () => {
                const job = {
                    id: 'job-9',
                    data: { userId: 99 },
                    progress: 0,
                    returnvalue: null,
                    failedReason: null,
                    getState: jest.fn().mockResolvedValue('completed'),
                };
                queue.getJob.mockResolvedValue(job);

                await expect(
                    controller.jobStatus('job-9', currentUser),
                ).rejects.toThrow(NotFoundException);
            });
        });
    });
});
