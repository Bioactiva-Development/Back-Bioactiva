import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    NOTIFICATION_REPOSITORY,
    type NotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/notification-repository.port';
import {
    NOTIFICATION_SCHEDULER,
    type NotificationSchedulerPort,
} from '@/modules/notifications/domain/ports/notification-scheduler.port';
import {
    EMAIL_TEMPLATE_READER,
    type EmailTemplateReaderPort,
} from '@/modules/notifications/domain/ports/email-template-reader.port';
import {
    ACTIVITY_CONTEXT_READER,
    type ActivityContextReaderPort,
} from '@/modules/notifications/domain/ports/activity-context-reader.port';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import {
    assertExternalAfterInternal,
    assertInternalDate,
    ensureBusinessHour,
} from '@/modules/notifications/domain/services/notification-schedule.policy';
import { ActivityContextNotFoundException } from '@/modules/notifications/domain/exceptions/activity-context-not-found.exception';
import { DuplicateNotificationException } from '@/modules/notifications/domain/exceptions/duplicate-notification.exception';
import { TemplateRequiredException } from '@/modules/notifications/domain/exceptions/template-required.exception';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { ClientEmailRequiredException } from '@/modules/notifications/domain/exceptions/client-email-required.exception';
import { CreateFollowUpCommand } from '@/modules/notifications/application/dto/create-follow-up.command';

export class CreateFollowUpUseCase {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: NotificationRepositoryPort,
        @Inject(NOTIFICATION_SCHEDULER)
        private readonly scheduler: NotificationSchedulerPort,
        @Inject(EMAIL_TEMPLATE_READER)
        private readonly templateReader: EmailTemplateReaderPort,
        @Inject(ACTIVITY_CONTEXT_READER)
        private readonly activityContextReader: ActivityContextReaderPort,
    ) {}

    async execute(
        command: CreateFollowUpCommand,
    ): Promise<ScheduledNotification> {
        const context = await this.activityContextReader.getByActivityId(
            command.idActividad,
        );
        if (!context) {
            throw new ActivityContextNotFoundException(
                `Actividad con id ${command.idActividad} no encontrada`,
            );
        }

        const existing = await this.notificationRepository.findActiveByActivity(
            command.idActividad,
        );
        if (existing) {
            throw new DuplicateNotificationException();
        }

        await this.assertTemplateExists(command.internal.idTemplate);
        await this.assertTemplateExists(command.external.idTemplate);

        if (
            !command.external.correoCliente ||
            !context.contactEmails.includes(command.external.correoCliente)
        ) {
            throw new ClientEmailRequiredException();
        }

        const internalDate = ensureBusinessHour(command.internal.fechaEnvio);
        const externalDate = ensureBusinessHour(command.external.fechaEnvio);
        assertInternalDate(internalDate, context.fechaFin, new Date());
        assertExternalAfterInternal(internalDate, externalDate);

        const notification = ScheduledNotification.createFollowUp({
            idActividad: context.idActividad,
            idLead: context.idLead,
            idResponsable: context.idResponsable,
            internal: {
                asunto: command.internal.asunto,
                cuerpo: command.internal.cuerpo,
                fechaEnvio: internalDate,
                idTemplate: command.internal.idTemplate,
            },
            external: {
                correoCliente: command.external.correoCliente,
                asunto: command.external.asunto,
                cuerpo: command.external.cuerpo,
                fechaEnvio: externalDate,
                idTemplate: command.external.idTemplate,
            },
        });

        const saved = await this.notificationRepository.save(notification);

        const internalJobId = await this.scheduler.scheduleInternal({
            notificationId: saved.id!,
            sendAt: internalDate,
        });
        const externalJobId = await this.scheduler.scheduleExternal({
            notificationId: saved.id!,
            sendAt: externalDate,
        });
        saved.assignInternalJob(internalJobId);
        saved.assignExternalJob(externalJobId);

        return this.notificationRepository.save(saved);
    }

    private async assertTemplateExists(idTemplate: number): Promise<void> {
        if (!idTemplate) {
            throw new TemplateRequiredException();
        }
        const template = await this.templateReader.findActiveById(idTemplate);
        if (!template) {
            throw new EmailTemplateNotFoundException(
                `Plantilla con id ${idTemplate} no encontrada o inactiva`,
            );
        }
    }
}
