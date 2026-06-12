import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    NOTIFICATION_REPOSITORY,
    type NotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/notification-repository.port';
import {
    NOTIFICATION_SCHEDULER,
    type NotificationSchedulerPort,
} from '@/modules/notifications/domain/ports/notification-scheduler.port';

/**
 * CU007 (flujo "Responsable marca la actividad como completada"): al completar
 * la actividad se cancela el correo externo pendiente y el seguimiento se cierra.
 * Lo invoca el módulo de actividades a través de un puerto, sin acoplarse.
 */
export class CompleteActivityFollowUpUseCase {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: NotificationRepositoryPort,
        @Inject(NOTIFICATION_SCHEDULER)
        private readonly scheduler: NotificationSchedulerPort,
    ) {}

    async execute(idActividad: number): Promise<void> {
        const notification =
            await this.notificationRepository.findActiveByActivity(idActividad);
        if (!notification) {
            return;
        }

        if (notification.hasPendingExternal() && notification.job_id_externo) {
            await this.scheduler.cancel(notification.job_id_externo);
        }

        notification.completeFollowUp();
        await this.notificationRepository.save(notification);
    }
}
