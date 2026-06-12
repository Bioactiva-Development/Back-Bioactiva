import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    EMAIL_TEMPLATE_REPOSITORY,
    type EmailTemplateRepositoryPort,
} from '@/modules/notifications/domain/ports/email-template-repository.port';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateNameTakenException } from '@/modules/notifications/domain/exceptions/email-template-name-taken.exception';
import { CreateEmailTemplateCommand } from '@/modules/notifications/application/dto/create-email-template.command';

export class CreateEmailTemplateUseCase {
    constructor(
        @Inject(EMAIL_TEMPLATE_REPOSITORY)
        private readonly templateRepository: EmailTemplateRepositoryPort,
    ) {}

    async execute(command: CreateEmailTemplateCommand): Promise<EmailTemplate> {
        const existing = await this.templateRepository.findByName(
            command.nombre,
        );
        if (existing) {
            throw new EmailTemplateNameTakenException(command.nombre);
        }

        const template = EmailTemplate.create({
            nombre: command.nombre,
            asunto: command.asunto,
            cuerpo: command.cuerpo,
            activo: command.activo,
        });
        return this.templateRepository.create(template);
    }
}
