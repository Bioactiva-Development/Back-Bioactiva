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
    assertInternalDate,
    ensureBusinessHour,
} from '@/modules/notifications/domain/services/notification-schedule.policy';
import { ActivityContextNotFoundException } from '@/modules/notifications/domain/exceptions/activity-context-not-found.exception';
import { DuplicateNotificationException } from '@/modules/notifications/domain/exceptions/duplicate-notification.exception';
import { TemplateRequiredException } from '@/modules/notifications/domain/exceptions/template-required.exception';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { CreateReminderCommand } from '@/modules/notifications/application/dto/create-reminder.command';

export class CreateReminderUseCase {
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
        command: CreateReminderCommand,
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

        if (!command.idTemplate) {
            throw new TemplateRequiredException();
        }
        const template = await this.templateReader.findActiveById(
            command.idTemplate,
        );
        if (!template) {
            throw new EmailTemplateNotFoundException(
                `Plantilla con id ${command.idTemplate} no encontrada o inactiva`,
            );
        }

        const fechaEnvio = ensureBusinessHour(command.fechaEnvio);
        assertInternalDate(fechaEnvio, context.fechaFin, new Date());

        const notification = ScheduledNotification.createReminder({
            idActividad: context.idActividad,
            idLead: context.idLead,
            idResponsable: context.idResponsable,
            internal: {
                asunto: command.asunto,
                cuerpo: command.cuerpo,
                fechaEnvio,
                idTemplate: command.idTemplate,
            },
        });

        const saved = await this.notificationRepository.save(notification);

        const jobId = await this.scheduler.scheduleInternal({
            notificationId: saved.id!,
            sendAt: fechaEnvio,
        });
        saved.assignInternalJob(jobId);

        return this.notificationRepository.save(saved);
    }
}
