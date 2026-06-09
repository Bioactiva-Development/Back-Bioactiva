import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    EMAIL_TEMPLATE_REPOSITORY,
    type EmailTemplateRepositoryPort,
} from '@/modules/notifications/domain/ports/email-template-repository.port';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { EmailTemplateInUseException } from '@/modules/notifications/domain/exceptions/email-template-in-use.exception';

export class DeleteEmailTemplateUseCase {
    constructor(
        @Inject(EMAIL_TEMPLATE_REPOSITORY)
        private readonly templateRepository: EmailTemplateRepositoryPort,
    ) {}

    async execute(id: number): Promise<void> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new EmailTemplateNotFoundException(
                `Plantilla con id ${id} no encontrada`,
            );
        }

        // CU007/CU011: una plantilla asociada a una notificación no se borra.
        const inUse = await this.templateRepository.isUsedByNotification(id);
        if (inUse) {
            throw new EmailTemplateInUseException();
        }

        await this.templateRepository.delete(id);
    }
}
