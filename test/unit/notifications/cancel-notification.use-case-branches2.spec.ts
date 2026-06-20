import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CancelNotificationUseCase } from '@/modules/notifications/application/use-cases/cancel-notification.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

/**
 * Branch coverage extra para `if (job_id_interno && !enviado_interno)`:
 *  - job_id_interno null            -> no cancela job interno.
 *  - job_id_interno set + enviado   -> no cancela job interno.
 *  - job_id_interno set + pendiente -> cancela job interno.
 */
describe('Notifications module — CancelNotificationUseCase branches2', () => {
    let useCase: CancelNotificationUseCase;
    let repository: any;
    let scheduler: any;

    const buildReminder = () => {
        const n = ScheduledNotification.createReminder({
            idActividad: 1,
            idLead: 2,
            idResponsable: 3,
            internal: {
                asunto: 'A',
                cuerpo: 'C',
                fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                idTemplate: 5,
            },
        });
        (n as any).id = 30;
        return n;
    };

    beforeEach(() => {
        repository = {
            findById: jest.fn(),
            save: jest.fn(async (n: any) => n),
        };
        scheduler = { cancel: jest.fn() };
        useCase = new CancelNotificationUseCase(repository, scheduler);
    });

    it('does not cancel an internal job when job_id_interno is null', async () => {
        const n = buildReminder();
        repository.findById.mockResolvedValue(n);

        await useCase.execute(30);

        expect(scheduler.cancel).not.toHaveBeenCalled();
        expect(n.estado).toBe(NotificationStatus.CANCELADA);
    });

    it('does not cancel an internal job when it was already sent', async () => {
        const n = buildReminder();
        n.assignInternalJob('rec-job-1');
        // Marcamos enviado sin pasar por markInternalSent (que vencería el
        // recordatorio e impediría cancel()).
        (n as any).enviado_interno = true;
        repository.findById.mockResolvedValue(n);

        await useCase.execute(30);

        expect(scheduler.cancel).not.toHaveBeenCalled();
        expect(n.estado).toBe(NotificationStatus.CANCELADA);
    });

    it('cancels the internal job when it is set and still pending', async () => {
        const n = buildReminder();
        n.assignInternalJob('rec-job-1');
        repository.findById.mockResolvedValue(n);

        await useCase.execute(30);

        expect(scheduler.cancel).toHaveBeenCalledWith('rec-job-1');
    });
});
