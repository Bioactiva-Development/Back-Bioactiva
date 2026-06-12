import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    EMAIL_TEMPLATE_REPOSITORY,
    type EmailTemplateRepositoryPort,
} from '@/modules/notifications/domain/ports/email-template-repository.port';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';

export class ListEmailTemplatesUseCase {
    constructor(
        @Inject(EMAIL_TEMPLATE_REPOSITORY)
        private readonly templateRepository: EmailTemplateRepositoryPort,
    ) {}

    async execute(includeInactive = false): Promise<EmailTemplate[]> {
        return this.templateRepository.list(includeInactive);
    }
}
