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
import {
    ScheduledNotification,
    type FollowUpInstanceInput,
} from '@/modules/notifications/domain/entities/scheduled-notification';
import {
    assertExternalAfterInternal,
    assertExternalDate,
    assertInstanceCount,
    assertInstancesChained,
    assertInternalDate,
    ensureBusinessHour,
} from '@/modules/notifications/domain/services/notification-schedule.policy';
import { LeadHasNoActiveActivityException } from '@/modules/notifications/domain/exceptions/lead-has-no-active-activity.exception';
import { DuplicateNotificationException } from '@/modules/notifications/domain/exceptions/duplicate-notification.exception';
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

        assertInstanceCount(command.instancias.length);

        if (
            !command.correoCliente ||
            !context.contactEmails.includes(command.correoCliente)
        ) {
            throw new ClientEmailRequiredException();
        }

        const now = new Date();
        const instancias: FollowUpInstanceInput[] = [];
        let previousExternal: Date | null = null;

        for (const instancia of command.instancias) {
            await this.assertTemplateExists(instancia.internal.idTemplate);
            await this.assertTemplateExists(instancia.external.idTemplate);

            const internalDate = ensureBusinessHour(
                instancia.internal.fechaEnvio,
            );
            const externalDate = ensureBusinessHour(
                instancia.external.fechaEnvio,
            );
            assertInternalDate(internalDate, context.fechaFin, now);
            assertExternalDate(externalDate, context.fechaFin, now);
            assertExternalAfterInternal(internalDate, externalDate);
            if (previousExternal) {
                assertInstancesChained(previousExternal, internalDate);
            }
            previousExternal = externalDate;

            instancias.push({
                internal: {
                    asunto: instancia.internal.asunto,
                    cuerpo: instancia.internal.cuerpo,
                    fechaEnvio: internalDate,
                    idTemplate: instancia.internal.idTemplate,
                },
                external: {
                    asunto: instancia.external.asunto,
                    cuerpo: instancia.external.cuerpo,
                    fechaEnvio: externalDate,
                    idTemplate: instancia.external.idTemplate,
                },
            });
        }

        const notification = ScheduledNotification.createFollowUp({
            idActividad: context.idActividad,
            idLead: context.idLead,
            idResponsable: context.idResponsable,
            correoCliente: command.correoCliente,
            instancias,
        });

        const saved = await this.notificationRepository.save(notification);

        for (const instancia of saved.instancias) {
            const internalJobId = await this.scheduler.scheduleInstanceInternal(
                {
                    instanciaId: instancia.id!,
                    sendAt: instancia.fecha_envio_interno,
                },
            );
            const externalJobId = await this.scheduler.scheduleInstanceExternal(
                {
                    instanciaId: instancia.id!,
                    sendAt: instancia.fecha_envio_externo,
                },
            );
            instancia.assignInternalJob(internalJobId);
            instancia.assignExternalJob(externalJobId);
        }

        return this.notificationRepository.save(saved);
    }

    private async assertTemplateExists(
        idTemplate: number | null,
    ): Promise<void> {
        // La plantilla es opcional: solo se valida cuando el usuario eligió una.
        if (idTemplate == null) {
            return;
        }
        const template = await this.templateReader.findActiveById(idTemplate);
        if (!template) {
            throw new EmailTemplateNotFoundException(
                `Plantilla con id ${idTemplate} no encontrada o inactiva`,
            );
        }
    }
}
