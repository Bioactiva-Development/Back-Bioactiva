import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DeleteEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/delete-email-template.use-case';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { EmailTemplateInUseException } from '@/modules/notifications/domain/exceptions/email-template-in-use.exception';

describe('Notifications module', () => {
    describe('DeleteEmailTemplateUseCase', () => {
        let useCase: DeleteEmailTemplateUseCase;
        let repository: any;

        const template = () =>
            new EmailTemplate(
                1,
                'Plantilla',
                'a',
                'b',
                true,
                new Date(),
                new Date(),
            );

        beforeEach(() => {
            repository = {
                findById: jest.fn().mockResolvedValue(template()),
                isUsedByNotification: jest.fn().mockResolvedValue(false),
                delete: jest.fn(),
            };
            useCase = new DeleteEmailTemplateUseCase(repository);
        });

        it('deletes a template that is not in use', async () => {
            await useCase.execute(1);

            expect(repository.delete).toHaveBeenCalledWith(1);
        });

        it('throws when the template does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(useCase.execute(99)).rejects.toThrow(
                EmailTemplateNotFoundException,
            );
            expect(repository.delete).not.toHaveBeenCalled();
        });

        it('blocks deletion when the template is used by a notification', async () => {
            repository.isUsedByNotification.mockResolvedValue(true);

            await expect(useCase.execute(1)).rejects.toThrow(
                EmailTemplateInUseException,
            );
            expect(repository.delete).not.toHaveBeenCalled();
        });
    });
});
