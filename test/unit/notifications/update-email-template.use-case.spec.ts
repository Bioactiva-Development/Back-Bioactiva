import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/update-email-template.use-case';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { EmailTemplateNameTakenException } from '@/modules/notifications/domain/exceptions/email-template-name-taken.exception';

describe('Notifications module', () => {
    describe('UpdateEmailTemplateUseCase', () => {
        let useCase: UpdateEmailTemplateUseCase;
        let repository: any;

        const existing = () =>
            new EmailTemplate(
                1,
                'Original',
                'Asunto',
                'Cuerpo',
                true,
                new Date(),
                new Date(),
            );

        beforeEach(() => {
            repository = {
                findById: jest.fn().mockResolvedValue(existing()),
                findByName: jest.fn().mockResolvedValue(null),
                save: jest.fn(async (t: any) => t),
            };
            useCase = new UpdateEmailTemplateUseCase(repository);
        });

        it('updates fields and can deactivate the template', async () => {
            const result = await useCase.execute(1, {
                asunto: 'Nuevo asunto',
                activo: false,
            });

            expect(result.asunto).toBe('Nuevo asunto');
            expect(result.activo).toBe(false);
            expect(repository.save).toHaveBeenCalled();
        });

        it('throws when the template does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(
                useCase.execute(99, { asunto: 'x' }),
            ).rejects.toThrow(EmailTemplateNotFoundException);
        });

        it('rejects renaming to a name taken by another template', async () => {
            repository.findByName.mockResolvedValue(
                new EmailTemplate(
                    2,
                    'Tomado',
                    'a',
                    'b',
                    true,
                    new Date(),
                    new Date(),
                ),
            );

            await expect(
                useCase.execute(1, { nombre: 'Tomado' }),
            ).rejects.toThrow(EmailTemplateNameTakenException);
        });
    });
});
