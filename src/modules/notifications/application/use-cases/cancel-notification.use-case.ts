import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    NOTIFICATION_REPOSITORY,
    type NotificationRepositoryPort,
} from '@/modules/notifications/domain/ports/notification-repository.port';
import {
    NOTIFICATION_SCHEDULER,
    type NotificationSchedulerPort,
} from '@/modules/notifications/domain/ports/notification-scheduler.port';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationNotFoundException } from '@/modules/notifications/domain/exceptions/notification-not-found.exception';

export class CancelNotificationUseCase {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: NotificationRepositoryPort,
        @Inject(NOTIFICATION_SCHEDULER)
        private readonly scheduler: NotificationSchedulerPort,
    ) {}

    async execute(id: number): Promise<ScheduledNotification> {
        const notification = await this.notificationRepository.findById(id);
        if (!notification) {
            throw new NotificationNotFoundException(
                `Notificación con id ${id} no encontrada`,
            );
        }

        // Lanza si ya está vencida/cancelada (no puede cancelarse lo ejecutado).
        notification.cancel();

        // Recordatorio: correo interno pendiente.
        if (notification.job_id_interno && !notification.enviado_interno) {
            await this.scheduler.cancel(notification.job_id_interno);
        }
        // Seguimiento: envíos de instancias aún pendientes.
        for (const jobId of notification.pendingInstanceJobIds()) {
            await this.scheduler.cancel(jobId);
        }

        return this.notificationRepository.save(notification);
    }
}
