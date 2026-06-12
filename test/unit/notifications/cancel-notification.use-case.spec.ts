import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CancelNotificationUseCase } from '@/modules/notifications/application/use-cases/cancel-notification.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationNotFoundException } from '@/modules/notifications/domain/exceptions/notification-not-found.exception';
import { NotificationCannotBeCancelledException } from '@/modules/notifications/domain/exceptions/notification-cannot-be-cancelled.exception';

describe('Notifications module', () => {
    describe('CancelNotificationUseCase', () => {
        let useCase: CancelNotificationUseCase;
        let repository: any;
        let scheduler: any;

        const buildFollowUp = () => {
            const n = ScheduledNotification.createFollowUp({
                idActividad: 1,
                idLead: 2,
                idResponsable: 3,
                internal: {
                    asunto: 'I',
                    cuerpo: 'I',
                    fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                    idTemplate: 5,
                },
                external: {
                    correoCliente: 'cliente@empresa.com',
                    asunto: 'E',
                    cuerpo: 'E',
                    fechaEnvio: new Date('2099-01-01T16:00:00.000Z'),
                    idTemplate: 6,
                },
            });
            (n as any).id = 20;
            n.assignInternalJob('notif-internal-20');
            n.assignExternalJob('notif-external-20');
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

        it('cancels a scheduled notification and removes its jobs', async () => {
            repository.findById.mockResolvedValue(buildFollowUp());

            const result = await useCase.execute(20);

            expect(result.estado).toBe(NotificationStatus.CANCELADA);
            expect(scheduler.cancel).toHaveBeenCalledWith('notif-internal-20');
            expect(scheduler.cancel).toHaveBeenCalledWith('notif-external-20');
            expect(repository.save).toHaveBeenCalled();
        });

        it('throws when the notification is not found', async () => {
            repository.findById.mockResolvedValue(null);
            await expect(useCase.execute(99)).rejects.toThrow(
                NotificationNotFoundException,
            );
        });

        it('throws when the notification was already executed', async () => {
            const n = buildFollowUp();
            n.markInternalSent();
            n.markExternalSent();
            repository.findById.mockResolvedValue(n);

            await expect(useCase.execute(20)).rejects.toThrow(
                NotificationCannotBeCancelledException,
            );
            expect(scheduler.cancel).not.toHaveBeenCalled();
        });
    });
});
