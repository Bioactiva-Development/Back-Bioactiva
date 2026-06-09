import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { TemplatesController } from '@/modules/notifications/infrastructure/http/templates.controller';
import { CreateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/create-email-template.use-case';
import { UpdateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/update-email-template.use-case';
import { GetEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/get-email-template.use-case';
import { ListEmailTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-email-templates.use-case';
import { DeleteEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/delete-email-template.use-case';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateResponseDto } from '@/modules/notifications/infrastructure/http/dto/email-template-response.dto';

describe('Notifications module', () => {
    describe('TemplatesController', () => {
        let controller: TemplatesController;
        let createUseCase: any;
        let listUseCase: any;
        let deleteUseCase: any;

        const sample = () =>
            new EmailTemplate(
                1,
                'Plantilla',
                'Asunto',
                'Cuerpo',
                true,
                new Date('2026-06-01'),
                new Date('2026-06-02'),
            );

        beforeEach(async () => {
            createUseCase = { execute: jest.fn() };
            listUseCase = { execute: jest.fn() };
            deleteUseCase = { execute: jest.fn() };

            const module = await Test.createTestingModule({
                controllers: [TemplatesController],
                providers: [
                    { provide: CreateEmailTemplateUseCase, useValue: createUseCase },
                    {
                        provide: UpdateEmailTemplateUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: GetEmailTemplateUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    { provide: ListEmailTemplatesUseCase, useValue: listUseCase },
                    { provide: DeleteEmailTemplateUseCase, useValue: deleteUseCase },
                ],
            }).compile();

            controller = module.get(TemplatesController);
        });

        it('maps a created template to a response DTO', async () => {
            createUseCase.execute.mockResolvedValue(sample());

            const result = await controller.create({
                nombre: 'Plantilla',
                asunto: 'Asunto',
                cuerpo: 'Cuerpo',
            });

            expect(result).toBeInstanceOf(EmailTemplateResponseDto);
            expect(result.id).toBe(1);
            expect(result.activo).toBe(true);
        });

        it('lists templates (active only by default)', async () => {
            listUseCase.execute.mockResolvedValue([sample()]);

            const result = await controller.list({});

            expect(listUseCase.execute).toHaveBeenCalledWith(false);
            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(EmailTemplateResponseDto);
        });

        it('delegates deletion to the use case', async () => {
            await controller.remove(1);

            expect(deleteUseCase.execute).toHaveBeenCalledWith(1);
        });
    });
});
