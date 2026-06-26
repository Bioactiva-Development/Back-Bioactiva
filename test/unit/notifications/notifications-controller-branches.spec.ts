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

describe('Notifications module', () => {
    describe('NotificationsController (remaining method branches)', () => {
        let controller: NotificationsController;
        let createFollowUp: any;
        let editFollowUp: any;
        let listActiveTemplates: any;
        let listInApp: any;
        let markInAppRead: any;

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
            createFollowUp = { execute: jest.fn() };
            editFollowUp = { execute: jest.fn() };
            listActiveTemplates = { execute: jest.fn() };
            listInApp = { execute: jest.fn() };
            markInAppRead = { execute: jest.fn() };

            const module = await Test.createTestingModule({
                controllers: [NotificationsController],
                providers: [
                    {
                        provide: CreateReminderUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: CreateFollowUpUseCase,
                        useValue: createFollowUp,
                    },
                    { provide: EditFollowUpUseCase, useValue: editFollowUp },
                    {
                        provide: CancelNotificationUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: ListNotificationsUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: ListActiveTemplatesUseCase,
                        useValue: listActiveTemplates,
                    },
                    {
                        provide: ListInAppNotificationsUseCase,
                        useValue: listInApp,
                    },
                    {
                        provide: MarkInAppNotificationReadUseCase,
                        useValue: markInAppRead,
                    },
                ],
            }).compile();

            controller = module.get(NotificationsController);
        });

        it('createFollowUp maps every instancia field', async () => {
            createFollowUp.execute.mockResolvedValue(sampleReminder());

            const result = await controller.createFollowUp({
                idLead: 2,
                correoCliente: 'cliente@x.com',
                instancias: [
                    {
                        internal: {
                            fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                            idTemplate: 5,
                            asunto: 'Int',
                            cuerpo: 'IntBody',
                        },
                        external: {
                            fechaEnvio: new Date('2099-01-01T15:00:00.000Z'),
                            idTemplate: 6,
                            asunto: 'Ext',
                            cuerpo: 'ExtBody',
                        },
                    },
                ],
            } as any);

            const payload = createFollowUp.execute.mock.calls[0][0];
            expect(payload.correoCliente).toBe('cliente@x.com');
            expect(payload.instancias[0].internal.asunto).toBe('Int');
            expect(payload.instancias[0].external.asunto).toBe('Ext');
            expect(result.id).toBe(10);
        });

        it('editFollowUp maps internal and external blocks passing the current user', async () => {
            editFollowUp.execute.mockResolvedValue(sampleReminder());

            await controller.editFollowUp(
                10,
                {
                    correoCliente: 'cliente@x.com',
                    internal: {
                        fechaEnvio: new Date('2099-01-01T14:00:00.000Z'),
                        idTemplate: 5,
                        asunto: 'Int',
                        cuerpo: 'IntBody',
                    },
                    external: {
                        fechaEnvio: new Date('2099-01-01T15:00:00.000Z'),
                        idTemplate: 6,
                        asunto: 'Ext',
                        cuerpo: 'ExtBody',
                    },
                } as any,
                { id: 7 } as any,
            );

            const payload = editFollowUp.execute.mock.calls[0][0];
            expect(payload.notificationId).toBe(10);
            expect(payload.requesterId).toBe(7);
            expect(payload.internal.asunto).toBe('Int');
            expect(payload.external.asunto).toBe('Ext');
        });

        it('listTemplates delegates to the use case', async () => {
            listActiveTemplates.execute.mockResolvedValue([]);

            await controller.listTemplates();

            expect(listActiveTemplates.execute).toHaveBeenCalled();
        });

        it('listInApp maps the notifications for the current user', async () => {
            listInApp.execute.mockResolvedValue([
                {
                    id: 1,
                    titulo: 'T',
                    mensaje: 'M',
                    estado: 'NO_LEIDA',
                    id_lead: null,
                    id_actividad: null,
                    created_at: new Date(),
                },
            ]);

            const result = await controller.listInApp({ id: 99 } as any);

            expect(listInApp.execute).toHaveBeenCalledWith(99);
            expect(result).toHaveLength(1);
        });

        it('markInAppRead delegates with id and user id', async () => {
            markInAppRead.execute.mockResolvedValue({
                id: 1,
                titulo: 'T',
                mensaje: 'M',
                estado: 'LEIDA',
                id_lead: null,
                id_actividad: null,
                created_at: new Date(),
            } as any);

            await controller.markInAppRead(1, { id: 99 } as any);

            expect(markInAppRead.execute).toHaveBeenCalledWith(1, 99);
        });
    });
});
