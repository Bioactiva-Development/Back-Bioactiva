import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { EditFollowUpUseCase } from '@/modules/notifications/application/use-cases/edit-follow-up.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationNotFoundException } from '@/modules/notifications/domain/exceptions/notification-not-found.exception';
import { FollowUpNotEditableException } from '@/modules/notifications/domain/exceptions/follow-up-not-editable.exception';
import { ClientEmailRequiredException } from '@/modules/notifications/domain/exceptions/client-email-required.exception';
import { InvalidScheduleDateException } from '@/modules/notifications/domain/exceptions/invalid-schedule-date.exception';

describe('Notifications module', () => {
    describe('EditFollowUpUseCase', () => {
        let useCase: EditFollowUpUseCase;
        let repository: any;
        let scheduler: any;
        let templateReader: any;
        let contextReader: any;

        const context = {
            idActividad: 1,
            idLead: 2,
            idResponsable: 3,
            responsableEmail: 'resp@bioactiva.com',
            fechaFin: new Date('2099-01-10T14:00:00.000Z'),
            estado: 'PENDIENTE',
            contactEmails: ['cliente@empresa.com', 'nuevo@empresa.com'],
        };

        const buildInstance = (overrides: Partial<FollowUpInstance> = {}) => {
            const instance = new FollowUpInstance(
                100,
                1,
                'Interno viejo',
                'Cuerpo interno viejo',
                new Date(2099, 0, 1, 9, 0, 0),
                5,
                'old-internal-job',
                false,
                'Externo viejo',
                'Cuerpo externo viejo',
                new Date(2099, 0, 1, 10, 0, 0),
                6,
                'old-external-job',
                false,
            );
            return Object.assign(instance, overrides);
        };

        const buildNotification = (instance: FollowUpInstance) =>
            new ScheduledNotification(
                20,
                NotificationType.SEGUIMIENTO,
                NotificationStatus.PROGRAMADA,
                1,
                2,
                3,
                null,
                null,
                null,
                null,
                null,
                false,
                'cliente@empresa.com',
                [instance],
                new Date(),
                new Date(),
            );

        const command = () => ({
            notificationId: 20,
            internal: {
                fechaEnvio: new Date(2099, 0, 2, 10, 0, 0),
                idTemplate: 5 as number | null,
                asunto: 'Interno nuevo',
                cuerpo: 'Cuerpo interno nuevo',
            },
            external: {
                fechaEnvio: new Date(2099, 0, 2, 11, 0, 0),
                idTemplate: 6 as number | null,
                asunto: 'Externo nuevo',
                cuerpo: 'Cuerpo externo nuevo',
            },
        });

        beforeEach(() => {
            repository = {
                findById: jest.fn(),
                save: jest.fn((n: any) => Promise.resolve(n)),
            };
            scheduler = {
                cancel: jest.fn().mockResolvedValue(undefined),
                scheduleInstanceInternal: jest
                    .fn()
                    .mockResolvedValue('new-internal-job'),
                scheduleInstanceExternal: jest
                    .fn()
                    .mockResolvedValue('new-external-job'),
            };
            templateReader = {
                findActiveById: jest
                    .fn()
                    .mockResolvedValue({ id: 1, activo: true }),
            };
            contextReader = {
                getActiveActivityByLead: jest.fn().mockResolvedValue(context),
            };
            useCase = new EditFollowUpUseCase(
                repository,
                scheduler,
                templateReader,
                contextReader,
            );
        });

        it('edits the instance, cancels old jobs and reschedules', async () => {
            const instance = buildInstance();
            repository.findById.mockResolvedValue(buildNotification(instance));

            const result = await useCase.execute(command());

            // Cancela los dos jobs previos.
            expect(scheduler.cancel).toHaveBeenCalledWith('old-internal-job');
            expect(scheduler.cancel).toHaveBeenCalledWith('old-external-job');
            // Reprograma ambos correos con los nuevos jobIds.
            const saved = result.singleInstance()!;
            expect(saved.asunto_interno).toBe('Interno nuevo');
            expect(saved.asunto_externo).toBe('Externo nuevo');
            expect(saved.job_id_interno).toBe('new-internal-job');
            expect(saved.job_id_externo).toBe('new-external-job');
        });

        it('updates the client email when provided and valid', async () => {
            const instance = buildInstance();
            repository.findById.mockResolvedValue(buildNotification(instance));

            const result = await useCase.execute({
                ...command(),
                correoCliente: 'nuevo@empresa.com',
            });

            expect(result.correo_cliente).toBe('nuevo@empresa.com');
        });

        it('rejects a client email not associated to the lead', async () => {
            const instance = buildInstance();
            repository.findById.mockResolvedValue(buildNotification(instance));

            await expect(
                useCase.execute({
                    ...command(),
                    correoCliente: 'otro@externo.com',
                }),
            ).rejects.toThrow(ClientEmailRequiredException);
        });

        it('rejects when external email is not after internal', async () => {
            const instance = buildInstance();
            repository.findById.mockResolvedValue(buildNotification(instance));

            await expect(
                useCase.execute({
                    ...command(),
                    external: {
                        ...command().external,
                        fechaEnvio: new Date(2099, 0, 2, 10, 0, 0),
                    },
                }),
            ).rejects.toThrow(InvalidScheduleDateException);
        });

        it('throws when the notification does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(useCase.execute(command())).rejects.toThrow(
                NotificationNotFoundException,
            );
        });

        it('rejects editing when an email was already sent', async () => {
            const instance = buildInstance({ enviado_interno: true });
            repository.findById.mockResolvedValue(buildNotification(instance));

            await expect(useCase.execute(command())).rejects.toThrow(
                FollowUpNotEditableException,
            );
            expect(scheduler.cancel).not.toHaveBeenCalled();
        });

        it('rejects editing a notification that is not PROGRAMADA', async () => {
            const instance = buildInstance();
            const notification = buildNotification(instance);
            notification.estado = NotificationStatus.VENCIDA;
            repository.findById.mockResolvedValue(notification);

            await expect(useCase.execute(command())).rejects.toThrow(
                FollowUpNotEditableException,
            );
        });
    });
});
