import { ForbiddenException } from '@nestjs/common';
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
    assertExternalDate,
    assertInternalDate,
} from '@/modules/notifications/domain/services/notification-schedule.policy';
import { NotificationNotFoundException } from '@/modules/notifications/domain/exceptions/notification-not-found.exception';
import { FollowUpNotEditableException } from '@/modules/notifications/domain/exceptions/follow-up-not-editable.exception';
import { LeadHasNoActiveActivityException } from '@/modules/notifications/domain/exceptions/lead-has-no-active-activity.exception';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { ClientEmailRequiredException } from '@/modules/notifications/domain/exceptions/client-email-required.exception';
import { EditFollowUpCommand } from '@/modules/notifications/application/dto/edit-follow-up.command';

/**
 * Edita la única instancia de un seguimiento PROGRAMADO cuyos correos aún no se
 * han enviado: actualiza asunto/cuerpo/plantilla/fecha de los correos interno y
 * externo (y, opcionalmente, el correo del cliente), cancela los envíos
 * programados anteriores y los reprograma con las nuevas fechas.
 */
export class EditFollowUpUseCase {
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
        command: EditFollowUpCommand,
    ): Promise<ScheduledNotification> {
        const notification = await this.notificationRepository.findById(
            command.notificationId,
        );
        if (!notification) {
            throw new NotificationNotFoundException(
                `Notificación con id ${command.notificationId} no encontrada`,
            );
        }
        if (notification.id_responsable !== command.requesterId) {
            throw new ForbiddenException(
                'No tienes permiso para editar esta notificación',
            );
        }

        // Solo seguimientos PROGRAMADOS y sin ningún correo enviado son editables.
        if (!notification.isFollowUp() || !notification.isFollowUpEditable()) {
            throw new FollowUpNotEditableException();
        }
        const instance = notification.singleInstance()!;

        await this.assertTemplateExists(command.internal.idTemplate);
        await this.assertTemplateExists(command.external.idTemplate);

        const context =
            await this.activityContextReader.getActiveActivityByLead(
                notification.id_lead,
            );
        if (!context) {
            throw new LeadHasNoActiveActivityException(
                `El lead con id ${notification.id_lead} no tiene una actividad activa`,
            );
        }

        // El correo del cliente (nuevo o el actual) debe pertenecer al contacto.
        const correoCliente =
            command.correoCliente ?? notification.correo_cliente;
        if (!correoCliente || !context.contactEmails.includes(correoCliente)) {
            throw new ClientEmailRequiredException();
        }

        const now = new Date();
        // Se respeta la fecha/hora exacta elegida por el usuario; no se reajusta
        // a un horario laboral. Solo se valida que sea coherente.
        const internalDate = command.internal.fechaEnvio;
        const externalDate = command.external.fechaEnvio;
        assertInternalDate(internalDate, context.fechaFin, now);
        assertExternalDate(externalDate, context.fechaFin, now);
        assertExternalAfterInternal(internalDate, externalDate);

        // Cancela los envíos programados previos antes de reprogramar.
        if (instance.job_id_interno) {
            await this.scheduler.cancel(instance.job_id_interno);
        }
        if (instance.job_id_externo) {
            await this.scheduler.cancel(instance.job_id_externo);
        }

        instance.edit({
            internal: {
                asunto: command.internal.asunto,
                cuerpo: command.internal.cuerpo,
                fechaEnvio: internalDate,
                idTemplate: command.internal.idTemplate,
            },
            external: {
                asunto: command.external.asunto,
                cuerpo: command.external.cuerpo,
                fechaEnvio: externalDate,
                idTemplate: command.external.idTemplate,
            },
        });
        notification.updateClientEmail(correoCliente);

        const saved = await this.notificationRepository.save(notification);
        const savedInstance = saved.singleInstance()!;

        const internalJobId = await this.scheduler.scheduleInstanceInternal({
            instanciaId: savedInstance.id!,
            sendAt: savedInstance.fecha_envio_interno,
        });
        const externalJobId = await this.scheduler.scheduleInstanceExternal({
            instanciaId: savedInstance.id!,
            sendAt: savedInstance.fecha_envio_externo,
        });
        savedInstance.assignInternalJob(internalJobId);
        savedInstance.assignExternalJob(externalJobId);

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
