import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    EMAIL_TEMPLATE_REPOSITORY,
    type EmailTemplateRepositoryPort,
} from '@/modules/notifications/domain/ports/email-template-repository.port';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';

export class GetEmailTemplateUseCase {
    constructor(
        @Inject(EMAIL_TEMPLATE_REPOSITORY)
        private readonly templateRepository: EmailTemplateRepositoryPort,
    ) {}

    async execute(id: number): Promise<EmailTemplate> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new EmailTemplateNotFoundException(
                `Plantilla con id ${id} no encontrada`,
            );
        }
        return template;
    }
}
