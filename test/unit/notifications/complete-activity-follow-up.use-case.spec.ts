import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CompleteActivityFollowUpUseCase } from '@/modules/notifications/application/use-cases/complete-activity-follow-up.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

describe('Notifications module', () => {
    describe('CompleteActivityFollowUpUseCase', () => {
        let useCase: CompleteActivityFollowUpUseCase;
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
            (n as any).id = 30;
            const instancia = n.instancias[0];
            (instancia as any).id = 100;
            instancia.assignInternalJob('seg-internal-100');
            instancia.assignExternalJob('seg-external-100');
            // El correo interno ya se envió; queda pendiente el externo.
            instancia.markInternalSent();
            return n;
        };

        beforeEach(() => {
            repository = {
                findActiveByActivity: jest.fn(),
                save: jest.fn(async (n: any) => n),
            };
            scheduler = { cancel: jest.fn() };
            useCase = new CompleteActivityFollowUpUseCase(
                repository,
                scheduler,
            );
        });

        it('cancels the pending external email and closes the follow-up', async () => {
            repository.findActiveByActivity.mockResolvedValue(buildFollowUp());

            await useCase.execute(1);

            expect(scheduler.cancel).toHaveBeenCalledWith('seg-external-100');
            expect(scheduler.cancel).not.toHaveBeenCalledWith(
                'seg-internal-100',
            );
            const saved = repository.save.mock.calls[0][0];
            expect(saved.estado).toBe(NotificationStatus.VENCIDA);
        });

        it('does nothing when the activity has no active notification', async () => {
            repository.findActiveByActivity.mockResolvedValue(null);

            await useCase.execute(1);

            expect(scheduler.cancel).not.toHaveBeenCalled();
            expect(repository.save).not.toHaveBeenCalled();
        });
    });
});
