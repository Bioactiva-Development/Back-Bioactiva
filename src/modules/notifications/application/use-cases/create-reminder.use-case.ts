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
import { computeReminderSendAt } from '@/modules/notifications/domain/services/notification-schedule.policy';
import { LeadHasNoActiveActivityException } from '@/modules/notifications/domain/exceptions/lead-has-no-active-activity.exception';
import { DuplicateNotificationException } from '@/modules/notifications/domain/exceptions/duplicate-notification.exception';
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
        const context = await this.activityContextReader.getActiveActivityByLead(
            command.idLead,
        );
        if (!context) {
            throw new LeadHasNoActiveActivityException(
                `El lead con id ${command.idLead} no tiene una actividad activa`,
            );
        }

        const existing = await this.notificationRepository.findActiveByActivity(
            context.idActividad,
        );
        if (existing) {
            throw new DuplicateNotificationException();
        }

        if (command.idTemplate != null) {
            const template = await this.templateReader.findActiveById(
                command.idTemplate,
            );
            if (!template) {
                throw new EmailTemplateNotFoundException(
                    `Plantilla con id ${command.idTemplate} no encontrada o inactiva`,
                );
            }
        }

        // El recordatorio se programa N minutos antes de que finalice la
        // actividad (máx. 2 horas antes). No se ajusta a horario laboral: debe
        // dispararse exactamente con la antelación pedida respecto a la fechaFin.
        const fechaEnvio = computeReminderSendAt(
            context.fechaFin,
            command.minutosAntes,
            new Date(),
        );

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
