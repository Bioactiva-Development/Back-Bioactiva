import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateReminderUseCase } from '@/modules/notifications/application/use-cases/create-reminder.use-case';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { DuplicateNotificationException } from '@/modules/notifications/domain/exceptions/duplicate-notification.exception';
import { EmailTemplateNotFoundException } from '@/modules/notifications/domain/exceptions/email-template-not-found.exception';
import { ActivityContextNotFoundException } from '@/modules/notifications/domain/exceptions/activity-context-not-found.exception';

describe('Notifications module', () => {
    describe('CreateReminderUseCase', () => {
        let useCase: CreateReminderUseCase;
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
            contactEmails: ['cliente@empresa.com'],
        };

        const command = {
            idActividad: 1,
            fechaEnvio: new Date(2099, 0, 1, 14, 0, 0),
            idTemplate: 5,
            asunto: 'Recordatorio',
            cuerpo: 'Cuerpo',
        };

        beforeEach(() => {
            repository = {
                save: jest.fn(async (n: any) => {
                    if (n.id === null) {
                        n.id = 10;
                    }
                    return n;
                }),
                findActiveByActivity: jest.fn().mockResolvedValue(null),
            };
            scheduler = {
                scheduleInternal: jest
                    .fn()
                    .mockResolvedValue('notif-internal-10'),
            };
            templateReader = {
                findActiveById: jest
                    .fn()
                    .mockResolvedValue({ id: 5, activo: true }),
            };
            contextReader = {
                getByActivityId: jest.fn().mockResolvedValue(context),
            };
            useCase = new CreateReminderUseCase(
                repository,
                scheduler,
                templateReader,
                contextReader,
            );
        });

        it('creates a reminder, schedules the internal email and stores the jobId', async () => {
            const result = await useCase.execute(command);

            expect(result.tipo).toBe(NotificationType.RECORDATORIO);
            expect(result.id_responsable).toBe(3);
            expect(scheduler.scheduleInternal).toHaveBeenCalledWith({
                notificationId: 10,
                sendAt: command.fechaEnvio,
            });
            expect(result.job_id_interno).toBe('notif-internal-10');
            expect(repository.save).toHaveBeenCalledTimes(2);
        });

        it('throws when the activity does not exist', async () => {
            contextReader.getByActivityId.mockResolvedValue(null);
            await expect(useCase.execute(command)).rejects.toThrow(
                ActivityContextNotFoundException,
            );
        });

        it('blocks a duplicate notification for the same activity', async () => {
            repository.findActiveByActivity.mockResolvedValue({ id: 99 });
            await expect(useCase.execute(command)).rejects.toThrow(
                DuplicateNotificationException,
            );
        });

        it('throws when the template is missing or inactive', async () => {
            templateReader.findActiveById.mockResolvedValue(null);
            await expect(useCase.execute(command)).rejects.toThrow(
                EmailTemplateNotFoundException,
            );
        });
    });
});
