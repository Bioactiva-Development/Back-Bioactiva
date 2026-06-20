import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { EditFollowUpUseCase } from '@/modules/notifications/application/use-cases/edit-follow-up.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { LeadHasNoActiveActivityException } from '@/modules/notifications/domain/exceptions/lead-has-no-active-activity.exception';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { ClientEmailRequiredException } from '@/modules/notifications/domain/exceptions/client-email-required.exception';

describe('Notifications module', () => {
    describe('EditFollowUpUseCase — branches', () => {
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
                cancel: jest.fn<any>().mockResolvedValue(undefined),
                scheduleInstanceInternal: jest
                    .fn<any>()
                    .mockResolvedValue('new-internal-job'),
                scheduleInstanceExternal: jest
                    .fn<any>()
                    .mockResolvedValue('new-external-job'),
            };
            templateReader = {
                findActiveById: jest
                    .fn<any>()
                    .mockResolvedValue({ id: 1, activo: true }),
            };
            contextReader = {
                getActiveActivityByLead: jest
                    .fn<any>()
                    .mockResolvedValue(context),
            };
            useCase = new EditFollowUpUseCase(
                repository,
                scheduler,
                templateReader,
                contextReader,
            );
        });

        it('throws when the lead has no active activity', async () => {
            repository.findById.mockResolvedValue(
                buildNotification(buildInstance()),
            );
            contextReader.getActiveActivityByLead.mockResolvedValue(null);

            await expect(useCase.execute(command())).rejects.toThrow(
                LeadHasNoActiveActivityException,
            );
        });

        it('throws when a chosen template does not exist or is inactive', async () => {
            repository.findById.mockResolvedValue(
                buildNotification(buildInstance()),
            );
            templateReader.findActiveById.mockResolvedValue(null);

            await expect(useCase.execute(command())).rejects.toThrow(
                EmailTemplateNotFoundException,
            );
        });

        it('skips template validation when idTemplate is null', async () => {
            repository.findById.mockResolvedValue(
                buildNotification(buildInstance()),
            );
            const cmd = command();
            cmd.internal.idTemplate = null;
            cmd.external.idTemplate = null;

            await useCase.execute(cmd);

            expect(templateReader.findActiveById).not.toHaveBeenCalled();
        });

        it('falls back to the existing client email when correoCliente is omitted', async () => {
            const instance = buildInstance();
            repository.findById.mockResolvedValue(buildNotification(instance));

            const result = await useCase.execute(command());

            expect(result.correo_cliente).toBe('cliente@empresa.com');
        });

        it('does not cancel jobs that are not assigned', async () => {
            const instance = buildInstance({
                job_id_interno: null,
                job_id_externo: null,
            });
            repository.findById.mockResolvedValue(buildNotification(instance));

            await useCase.execute(command());

            expect(scheduler.cancel).not.toHaveBeenCalled();
        });

        it('rejects when neither a new nor an existing client email is valid', async () => {
            const instance = buildInstance();
            const notification = buildNotification(instance);
            notification.correo_cliente = null;
            repository.findById.mockResolvedValue(notification);

            await expect(useCase.execute(command())).rejects.toThrow(
                ClientEmailRequiredException,
            );
        });
    });
});
