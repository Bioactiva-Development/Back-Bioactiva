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
 * Al eliminar una actividad se cancelan todos los envíos pendientes asociados,
 * tanto el correo interno del recordatorio como los correos de las instancias
 * de seguimiento. La notificación queda en estado CANCELADA.
 */
export class CancelActivityNotificationsUseCase {
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

        if (notification.job_id_interno && !notification.enviado_interno) {
            await this.scheduler.cancel(notification.job_id_interno);
        }
        for (const jobId of notification.pendingInstanceJobIds()) {
            await this.scheduler.cancel(jobId);
        }

        notification.cancel();
        await this.notificationRepository.save(notification);
    }
}
