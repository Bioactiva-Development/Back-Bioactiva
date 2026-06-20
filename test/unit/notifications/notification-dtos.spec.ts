import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
    NotificationResponseDto,
    FollowUpInstanceResponseDto,
} from '@/modules/notifications/infrastructure/http/dto/notification-response.dto';
import { InAppNotificationResponseDto } from '@/modules/notifications/infrastructure/http/dto/in-app-notification-response.dto';
import {
    HttpCreateFollowUpDto,
    HttpFollowUpInstanceDto,
    HttpFollowUpEmailDto,
} from '@/modules/notifications/infrastructure/http/dto/create-follow-up.dto.http';
import { HttpCreateReminderDto } from '@/modules/notifications/infrastructure/http/dto/create-reminder.dto.http';
import { HttpEditFollowUpDto } from '@/modules/notifications/infrastructure/http/dto/edit-follow-up.dto.http';
import { ListNotificationsQueryDto } from '@/modules/notifications/infrastructure/http/dto/list-notifications-query.dto.http';
import { ListTemplatesQueryDto } from '@/modules/notifications/infrastructure/http/dto/list-templates-query.dto.http';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationStatus } from '@/modules/notifications/domain/enums/in-app-notification-status';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';

describe('Notifications DTOs', () => {
    describe('NotificationResponseDto / FollowUpInstanceResponseDto', () => {
        it('maps a reminder with no instancias and nullable fields', () => {
            const reminder = ScheduledNotification.createReminder({
                idActividad: 1,
                idLead: 2,
                idResponsable: 3,
                internal: {
                    asunto: 'Asunto',
                    cuerpo: 'Cuerpo',
                    fechaEnvio: new Date('2099-01-01T00:00:00.000Z'),
                    idTemplate: 5,
                },
            });
            (reminder as any).id = 10;

            const dto = new NotificationResponseDto(reminder);

            expect(dto.id).toBe(10);
            expect(dto.tipo).toBe(NotificationType.RECORDATORIO);
            expect(dto.estado).toBe(NotificationStatus.PROGRAMADA);
            expect(dto.idActividad).toBe(1);
            expect(dto.idLead).toBe(2);
            expect(dto.idResponsable).toBe(3);
            expect(dto.asuntoInterno).toBe('Asunto');
            expect(dto.correoCliente).toBeNull();
            expect(dto.instancias).toEqual([]);
            expect(dto.createdAt).toBeInstanceOf(Date);
        });

        it('maps a follow-up with one instance', () => {
            const followUp = ScheduledNotification.createFollowUp({
                idActividad: 1,
                idLead: 2,
                idResponsable: 3,
                correoCliente: 'cliente@empresa.com',
                instancias: [
                    {
                        internal: {
                            asunto: 'Int',
                            cuerpo: 'CuerpoInt',
                            fechaEnvio: new Date('2099-01-01T00:00:00.000Z'),
                            idTemplate: null,
                        },
                        external: {
                            asunto: 'Ext',
                            cuerpo: 'CuerpoExt',
                            fechaEnvio: new Date('2099-01-02T00:00:00.000Z'),
                            idTemplate: null,
                        },
                    },
                ],
            });
            (followUp as any).id = 20;
            (followUp.instancias[0] as any).id = 100;

            const dto = new NotificationResponseDto(followUp);

            expect(dto.tipo).toBe(NotificationType.SEGUIMIENTO);
            expect(dto.correoCliente).toBe('cliente@empresa.com');
            expect(dto.asuntoInterno).toBeNull();
            expect(dto.instancias).toHaveLength(1);
            const inst = dto.instancias[0];
            expect(inst).toBeInstanceOf(FollowUpInstanceResponseDto);
            expect(inst.id).toBe(100);
            expect(inst.orden).toBe(1);
            expect(inst.asuntoInterno).toBe('Int');
            expect(inst.asuntoExterno).toBe('Ext');
            expect(inst.enviadoInterno).toBe(false);
            expect(inst.enviadoExterno).toBe(false);
        });

        it('maps a FollowUpInstanceResponseDto directly', () => {
            const instancia = new FollowUpInstance(
                7,
                2,
                'AI',
                'CI',
                new Date('2099-01-01T00:00:00.000Z'),
                null,
                null,
                true,
                'AE',
                'CE',
                new Date('2099-01-02T00:00:00.000Z'),
                null,
                null,
                true,
            );

            const dto = new FollowUpInstanceResponseDto(instancia);

            expect(dto.id).toBe(7);
            expect(dto.orden).toBe(2);
            expect(dto.enviadoInterno).toBe(true);
            expect(dto.enviadoExterno).toBe(true);
        });
    });

    describe('InAppNotificationResponseDto', () => {
        it('maps an in-app notification with optional ids set', () => {
            const notification = InAppNotification.createLeadAlert({
                idUsuario: 5,
                idLead: 9,
                titulo: 'Lead estancado',
                mensaje: 'Revisa el lead',
            });
            (notification as any).id = 1;

            const dto = new InAppNotificationResponseDto(notification);

            expect(dto.id).toBe(1);
            expect(dto.titulo).toBe('Lead estancado');
            expect(dto.mensaje).toBe('Revisa el lead');
            expect(dto.estado).toBe(InAppNotificationStatus.NO_LEIDA);
            expect(dto.idLead).toBe(9);
            expect(dto.idActividad).toBeNull();
            expect(dto.createdAt).toBeInstanceOf(Date);
        });
    });

    describe('HttpCreateReminderDto', () => {
        it('accepts a valid payload', async () => {
            const dto = plainToInstance(HttpCreateReminderDto, {
                idLead: '1',
                minutosAntes: '15',
                idTemplate: '2',
                asunto: 'A',
                cuerpo: 'C',
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.idLead).toBe(1);
            expect(dto.minutosAntes).toBe(15);
            expect(dto.idTemplate).toBe(2);
        });

        it('defaults idTemplate to null when omitted', async () => {
            const dto = plainToInstance(HttpCreateReminderDto, {
                idLead: 1,
                minutosAntes: 15,
                asunto: 'A',
                cuerpo: 'C',
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.idTemplate).toBeNull();
        });

        it('rejects out-of-range minutosAntes and empty strings', async () => {
            const dto = plainToInstance(HttpCreateReminderDto, {
                idLead: 0,
                minutosAntes: 0,
                asunto: '',
                cuerpo: '',
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('HttpCreateFollowUpDto', () => {
        const validInstance = () => ({
            internal: {
                fechaEnvio: '2099-01-01T14:00:00.000Z',
                idTemplate: 1,
                asunto: 'Asunto interno',
                cuerpo: '<p>Interno</p>',
            },
            external: {
                fechaEnvio: '2099-01-02T14:00:00.000Z',
                idTemplate: null,
                asunto: 'Asunto externo',
                cuerpo: '<p>Externo</p>',
            },
        });

        it('accepts a valid payload', async () => {
            const dto = plainToInstance(HttpCreateFollowUpDto, {
                idLead: '1',
                correoCliente: 'cliente@empresa.com',
                instancias: [validInstance()],
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.idLead).toBe(1);
            expect(dto.instancias[0]).toBeInstanceOf(HttpFollowUpInstanceDto);
            expect(dto.instancias[0].internal).toBeInstanceOf(
                HttpFollowUpEmailDto,
            );
            expect(dto.instancias[0].internal.fechaEnvio).toBeInstanceOf(Date);
        });

        it('rejects an invalid email and empty instancias array', async () => {
            const dto = plainToInstance(HttpCreateFollowUpDto, {
                idLead: 1,
                correoCliente: 'not-an-email',
                instancias: [],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
        });

        it('rejects more than one instancia and bad nested fields', async () => {
            const dto = plainToInstance(HttpCreateFollowUpDto, {
                idLead: 1,
                correoCliente: 'cliente@empresa.com',
                instancias: [
                    {
                        internal: {
                            fechaEnvio: 'not-a-date',
                            idTemplate: 0,
                            asunto: '',
                            cuerpo: '',
                        },
                        external: validInstance().external,
                    },
                    validInstance(),
                ],
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('HttpEditFollowUpDto', () => {
        const validInstance = () => ({
            internal: {
                fechaEnvio: '2099-01-01T14:00:00.000Z',
                idTemplate: null,
                asunto: 'Asunto interno',
                cuerpo: '<p>Interno</p>',
            },
            external: {
                fechaEnvio: '2099-01-02T14:00:00.000Z',
                idTemplate: null,
                asunto: 'Asunto externo',
                cuerpo: '<p>Externo</p>',
            },
        });

        it('accepts an omitted correoCliente', async () => {
            const dto = plainToInstance(HttpEditFollowUpDto, {
                internal: validInstance().internal,
                external: validInstance().external,
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.correoCliente).toBeUndefined();
        });

        it('accepts a valid correoCliente and rejects an invalid one', async () => {
            const ok = plainToInstance(HttpEditFollowUpDto, {
                correoCliente: 'cliente@empresa.com',
                internal: validInstance().internal,
                external: validInstance().external,
            });
            const bad = plainToInstance(HttpEditFollowUpDto, {
                correoCliente: 'invalid',
                internal: validInstance().internal,
                external: validInstance().external,
            });

            expect(await validate(ok)).toHaveLength(0);
            expect((await validate(bad)).length).toBeGreaterThan(0);
        });
    });

    describe('ListNotificationsQueryDto', () => {
        it('accepts allowed estado values and numeric filters', async () => {
            const dto = plainToInstance(ListNotificationsQueryDto, {
                estado: NotificationStatus.PROGRAMADA,
                idLead: '1',
                idResponsable: '3',
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.idLead).toBe(1);
            expect(dto.idResponsable).toBe(3);
        });

        it('accepts an empty query', async () => {
            const dto = plainToInstance(ListNotificationsQueryDto, {});

            expect(await validate(dto)).toHaveLength(0);
        });

        it('rejects a disallowed estado and invalid numbers', async () => {
            const dto = plainToInstance(ListNotificationsQueryDto, {
                estado: NotificationStatus.CANCELADA,
                idLead: 0,
                idResponsable: 'x',
            });

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('ListTemplatesQueryDto', () => {
        it('transforms the string "true" into boolean true', async () => {
            const dto = plainToInstance(ListTemplatesQueryDto, {
                includeInactive: 'true',
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.includeInactive).toBe(true);
        });

        it('transforms a boolean true and other values to false', async () => {
            const dtoTrue = plainToInstance(ListTemplatesQueryDto, {
                includeInactive: true,
            });
            const dtoFalse = plainToInstance(ListTemplatesQueryDto, {
                includeInactive: 'false',
            });

            expect(await validate(dtoTrue)).toHaveLength(0);
            expect(dtoTrue.includeInactive).toBe(true);
            expect(await validate(dtoFalse)).toHaveLength(0);
            expect(dtoFalse.includeInactive).toBe(false);
        });

        it('accepts an omitted includeInactive', async () => {
            const dto = plainToInstance(ListTemplatesQueryDto, {});

            expect(await validate(dto)).toHaveLength(0);
            expect(dto.includeInactive).toBeUndefined();
        });
    });
});
