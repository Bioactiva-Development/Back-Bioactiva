import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { NotificationsController } from '@/modules/notifications/infrastructure/http/notifications.controller';
import { CreateReminderUseCase } from '@/modules/notifications/application/use-cases/create-reminder.use-case';
import { CreateFollowUpUseCase } from '@/modules/notifications/application/use-cases/create-follow-up.use-case';
import { EditFollowUpUseCase } from '@/modules/notifications/application/use-cases/edit-follow-up.use-case';
import { CancelNotificationUseCase } from '@/modules/notifications/application/use-cases/cancel-notification.use-case';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { ListActiveTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-active-templates.use-case';
import { ListInAppNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-in-app-notifications.use-case';
import { MarkInAppNotificationReadUseCase } from '@/modules/notifications/application/use-cases/mark-in-app-notification-read.use-case';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationResponseDto } from '@/modules/notifications/infrastructure/http/dto/notification-response.dto';

describe('Notifications module', () => {
    describe('NotificationsController', () => {
        let controller: NotificationsController;
        let createReminder: any;
        let listNotifications: any;
        let cancelNotification: any;

        const sampleReminder = () => {
            const n = ScheduledNotification.createReminder({
                idActividad: 1,
                idLead: 2,
                idResponsable: 3,
                internal: {
                    asunto: 'Asunto',
                    cuerpo: 'Cuerpo',
                    fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                    idTemplate: 5,
                },
            });
            (n as any).id = 10;
            return n;
        };

        beforeEach(async () => {
            createReminder = { execute: jest.fn() };
            listNotifications = { execute: jest.fn() };
            cancelNotification = { execute: jest.fn() };

            const module = await Test.createTestingModule({
                controllers: [NotificationsController],
                providers: [
                    {
                        provide: CreateReminderUseCase,
                        useValue: createReminder,
                    },
                    {
                        provide: CreateFollowUpUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: EditFollowUpUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: CancelNotificationUseCase,
                        useValue: cancelNotification,
                    },
                    {
                        provide: ListNotificationsUseCase,
                        useValue: listNotifications,
                    },
                    {
                        provide: ListActiveTemplatesUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: ListInAppNotificationsUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: MarkInAppNotificationReadUseCase,
                        useValue: { execute: jest.fn() },
                    },
                ],
            }).compile();

            controller = module.get(NotificationsController);
        });

        it('maps a created reminder to a response DTO', async () => {
            createReminder.execute.mockResolvedValue(sampleReminder());

            const result = await controller.createReminder({
                idLead: 2,
                fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                idTemplate: 5,
                asunto: 'Asunto',
                cuerpo: 'Cuerpo',
            });

            expect(result).toBeInstanceOf(NotificationResponseDto);
            expect(result.id).toBe(10);
            expect(result.idResponsable).toBe(3);
        });

        it('lists notifications filtered by estado with pagination metadata', async () => {
            listNotifications.execute.mockResolvedValue({
                data: [sampleReminder()],
                total: 1,
            });

            const result = await controller.list({
                estado: NotificationStatus.PROGRAMADA,
            });

            expect(listNotifications.execute).toHaveBeenCalledWith({
                estado: NotificationStatus.PROGRAMADA,
                idLead: undefined,
                idResponsable: undefined,
                page: 1,
                limit: 10,
            });
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toBeInstanceOf(NotificationResponseDto);
            expect(result.meta).toEqual({
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            });
        });

        it('forwards explicit page and limit', async () => {
            listNotifications.execute.mockResolvedValue({
                data: [],
                total: 30,
            });

            const result = await controller.list({ page: 2, limit: 5 });

            expect(listNotifications.execute).toHaveBeenCalledWith({
                estado: undefined,
                idLead: undefined,
                idResponsable: undefined,
                page: 2,
                limit: 5,
            });
            expect(result.meta).toEqual({
                page: 2,
                limit: 5,
                total: 30,
                totalPages: 6,
            });
        });

        it('cancels a notification by id', async () => {
            const cancelled = sampleReminder();
            cancelled.cancel();
            cancelNotification.execute.mockResolvedValue(cancelled);

            const result = await controller.cancel(10);

            expect(cancelNotification.execute).toHaveBeenCalledWith(10);
            expect(result.estado).toBe(NotificationStatus.CANCELADA);
        });
    });
});
