import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { TemplatesController } from '@/modules/notifications/infrastructure/http/templates.controller';
import { CreateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/create-email-template.use-case';
import { UpdateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/update-email-template.use-case';
import { GetEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/get-email-template.use-case';
import { ListEmailTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-email-templates.use-case';
import { DeleteEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/delete-email-template.use-case';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';

describe('Notifications module', () => {
    describe('TemplatesController (optional-field branches)', () => {
        let controller: TemplatesController;
        let listUseCase: any;

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
            listUseCase = { execute: jest.fn() };

            const module = await Test.createTestingModule({
                controllers: [TemplatesController],
                providers: [
                    {
                        provide: CreateEmailTemplateUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: UpdateEmailTemplateUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: GetEmailTemplateUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: ListEmailTemplatesUseCase,
                        useValue: listUseCase,
                    },
                    {
                        provide: DeleteEmailTemplateUseCase,
                        useValue: { execute: jest.fn() },
                    },
                ],
            }).compile();

            controller = module.get(TemplatesController);
        });

        it('list forwards includeInactive when present', async () => {
            listUseCase.execute.mockResolvedValue([sample()]);

            await controller.list({ includeInactive: true });

            expect(listUseCase.execute).toHaveBeenCalledWith(true);
        });

        it('list defaults includeInactive to false when omitted', async () => {
            listUseCase.execute.mockResolvedValue([sample()]);

            await controller.list({});

            expect(listUseCase.execute).toHaveBeenCalledWith(false);
        });
    });
});
