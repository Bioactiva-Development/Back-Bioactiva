import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    EMAIL_TEMPLATE_READER,
    type EmailTemplate,
    type EmailTemplateReaderPort,
} from '@/modules/notifications/domain/ports/email-template-reader.port';

export class ListActiveTemplatesUseCase {
    constructor(
        @Inject(EMAIL_TEMPLATE_READER)
        private readonly templateReader: EmailTemplateReaderPort,
    ) {}

    async execute(): Promise<EmailTemplate[]> {
        return this.templateReader.listActive();
    }
}
