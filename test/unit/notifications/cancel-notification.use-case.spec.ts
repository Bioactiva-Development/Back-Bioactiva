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
            (n as any).id = 20;
            const instancia = n.instancias[0];
            (instancia as any).id = 100;
            instancia.assignInternalJob('seg-internal-100');
            instancia.assignExternalJob('seg-external-100');
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

        it('cancels a scheduled follow-up and removes its instance jobs', async () => {
            repository.findById.mockResolvedValue(buildFollowUp());

            const result = await useCase.execute(20, 3);

            expect(result.estado).toBe(NotificationStatus.CANCELADA);
            expect(scheduler.cancel).toHaveBeenCalledWith('seg-internal-100');
            expect(scheduler.cancel).toHaveBeenCalledWith('seg-external-100');
            expect(repository.save).toHaveBeenCalled();
        });

        it('throws when the notification is not found', async () => {
            repository.findById.mockResolvedValue(null);
            await expect(useCase.execute(99, 3)).rejects.toThrow(
                NotificationNotFoundException,
            );
        });

        it('throws ForbiddenException when the requester is not the responsable', async () => {
            repository.findById.mockResolvedValue(buildFollowUp());
            await expect(useCase.execute(20, 99)).rejects.toThrow(
                'No tienes permiso para cancelar esta notificación',
            );
            expect(scheduler.cancel).not.toHaveBeenCalled();
        });

        it('throws when the follow-up was already executed', async () => {
            const n = buildFollowUp();
            n.instancias[0].markInternalSent();
            n.instancias[0].markExternalSent();
            n.closeIfAllInstancesSent();
            repository.findById.mockResolvedValue(n);

            await expect(useCase.execute(20, 3)).rejects.toThrow(
                NotificationCannotBeCancelledException,
            );
            expect(scheduler.cancel).not.toHaveBeenCalled();
        });
    });
});
