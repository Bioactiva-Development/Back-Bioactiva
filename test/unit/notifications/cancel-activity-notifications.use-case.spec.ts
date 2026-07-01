import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CancelActivityNotificationsUseCase } from '@/modules/notifications/application/use-cases/cancel-activity-notifications.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

describe('Notifications module', () => {
    describe('CancelActivityNotificationsUseCase', () => {
        let useCase: CancelActivityNotificationsUseCase;
        let repository: any;
        let scheduler: any;

        const buildReminder = () =>
            ScheduledNotification.createReminder({
                idActividad: 1,
                idLead: 2,
                idResponsable: 3,
                internal: {
                    asunto: 'I',
                    cuerpo: 'I',
                    fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                    idTemplate: 5,
                },
            });

        const buildFollowUp = () => {
            const n = ScheduledNotification.createFollowUp({
                idActividad: 1,
                idLead: 2,
                idResponsable: 3,
                correoCliente: 'cliente@empresa.com',
                instancias: [
                    {
                        internal: {
                            asunto: 'I',
                            cuerpo: 'I',
                            fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                            idTemplate: 5,
                        },
                        external: {
                            asunto: 'E',
                            cuerpo: 'E',
                            fechaEnvio: new Date('2099-01-01T16:00:00.000Z'),
                            idTemplate: 6,
                        },
                    },
                ],
            });
            return n;
        };

        beforeEach(() => {
            repository = {
                findActiveByActivity: jest.fn(),
                save: jest.fn(async (n: any) => n),
            };
            scheduler = { cancel: jest.fn() };
            useCase = new CancelActivityNotificationsUseCase(
                repository,
                scheduler,
            );
        });

        it('does nothing when there is no active notification for the activity', async () => {
            repository.findActiveByActivity.mockResolvedValue(null);

            await useCase.execute(1);

            expect(scheduler.cancel).not.toHaveBeenCalled();
            expect(repository.save).not.toHaveBeenCalled();
        });

        it('cancels the internal job of a reminder and marks it as CANCELADA', async () => {
            const reminder = buildReminder();
            reminder.assignInternalJob('int-job-1');
            repository.findActiveByActivity.mockResolvedValue(reminder);

            await useCase.execute(1);

            expect(scheduler.cancel).toHaveBeenCalledWith('int-job-1');
            expect(scheduler.cancel).toHaveBeenCalledTimes(1);
            expect(reminder.estado).toBe(NotificationStatus.CANCELADA);
            expect(repository.save).toHaveBeenCalledWith(reminder);
        });

        it('does not cancel the internal job when the reminder has none assigned', async () => {
            const reminder = buildReminder();
            repository.findActiveByActivity.mockResolvedValue(reminder);

            await useCase.execute(1);

            expect(scheduler.cancel).not.toHaveBeenCalled();
            expect(reminder.estado).toBe(NotificationStatus.CANCELADA);
            expect(repository.save).toHaveBeenCalledWith(reminder);
        });

        it('does not cancel the internal job when it was already sent', async () => {
            const reminder = buildReminder();
            reminder.assignInternalJob('int-job-1');
            reminder.markInternalSent();
            (reminder as any).estado = NotificationStatus.PROGRAMADA;
            repository.findActiveByActivity.mockResolvedValue(reminder);

            await useCase.execute(1);

            expect(scheduler.cancel).not.toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalledWith(reminder);
        });

        it('cancels every pending instance job of a follow-up', async () => {
            const followUp = buildFollowUp();
            const instancia = followUp.instancias[0];
            instancia.assignInternalJob('seg-internal-1');
            instancia.assignExternalJob('seg-external-1');
            repository.findActiveByActivity.mockResolvedValue(followUp);

            await useCase.execute(1);

            expect(scheduler.cancel).toHaveBeenCalledWith('seg-internal-1');
            expect(scheduler.cancel).toHaveBeenCalledWith('seg-external-1');
            expect(scheduler.cancel).toHaveBeenCalledTimes(2);
            expect(followUp.estado).toBe(NotificationStatus.CANCELADA);
            expect(repository.save).toHaveBeenCalledWith(followUp);
        });

        it('does not cancel instance jobs already sent', async () => {
            const followUp = buildFollowUp();
            const instancia = followUp.instancias[0];
            instancia.assignInternalJob('seg-internal-1');
            instancia.assignExternalJob('seg-external-1');
            instancia.markInternalSent();
            instancia.markExternalSent();
            repository.findActiveByActivity.mockResolvedValue(followUp);

            await useCase.execute(1);

            expect(scheduler.cancel).not.toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalledWith(followUp);
        });
    });
});
