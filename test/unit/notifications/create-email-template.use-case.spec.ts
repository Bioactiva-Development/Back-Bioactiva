import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/create-email-template.use-case';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateNameTakenException } from '@/modules/notifications/domain/exceptions/email-template-name-taken.exception';

describe('Notifications module', () => {
    describe('CreateEmailTemplateUseCase', () => {
        let useCase: CreateEmailTemplateUseCase;
        let repository: any;

        const command = {
            nombre: 'Recordatorio estándar',
            asunto: 'Asunto',
            cuerpo: '<p>Cuerpo</p>',
        };

        beforeEach(() => {
            repository = {
                findByName: jest.fn().mockResolvedValue(null),
                create: jest.fn(async (t: any) => {
                    (t as any).id = 1;
                    return t;
                }),
            };
            useCase = new CreateEmailTemplateUseCase(repository);
        });

        it('creates a template (active by default)', async () => {
            const result = await useCase.execute(command);

            expect(result).toBeInstanceOf(EmailTemplate);
            expect(result.id).toBe(1);
            expect(result.activo).toBe(true);
            expect(repository.create).toHaveBeenCalled();
        });

        it('rejects a duplicate name', async () => {
            repository.findByName.mockResolvedValue({ id: 9 });

            await expect(useCase.execute(command)).rejects.toThrow(
                EmailTemplateNameTakenException,
            );
            expect(repository.create).not.toHaveBeenCalled();
        });
    });
});
