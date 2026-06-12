import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    EMAIL_TEMPLATE_REPOSITORY,
    type EmailTemplateRepositoryPort,
} from '@/modules/notifications/domain/ports/email-template-repository.port';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { EmailTemplateNameTakenException } from '@/modules/notifications/domain/exceptions/email-template-name-taken.exception';
import { UpdateEmailTemplateCommand } from '@/modules/notifications/application/dto/update-email-template.command';

export class UpdateEmailTemplateUseCase {
    constructor(
        @Inject(EMAIL_TEMPLATE_REPOSITORY)
        private readonly templateRepository: EmailTemplateRepositoryPort,
    ) {}

    async execute(
        id: number,
        command: UpdateEmailTemplateCommand,
    ): Promise<EmailTemplate> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new EmailTemplateNotFoundException(
                `Plantilla con id ${id} no encontrada`,
            );
        }

        if (command.nombre && command.nombre !== template.nombre) {
            const other = await this.templateRepository.findByName(
                command.nombre,
            );
            if (other && other.id !== id) {
                throw new EmailTemplateNameTakenException(command.nombre);
            }
        }

        template.update(command);
        return this.templateRepository.save(template);
    }
}
