import { describe, expect, it } from '@jest/globals';
import { NotificationMapper } from '@/modules/notifications/infrastructure/persistance/mappers/notification.mapper';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';

describe('Notifications module', () => {
    describe('NotificationMapper', () => {
        const createdAt = new Date('2024-01-01T00:00:00Z');
        const updatedAt = new Date('2024-01-02T00:00:00Z');
        const fecha = new Date('2024-01-03T00:00:00Z');

        const buildInstanciaRecord = (orden: number, id: number) => ({
            id,
            orden,
            asuntoInterno: 'AI',
            cuerpoInterno: 'CI',
            fechaEnvioInterno: fecha,
            idTemplateInterno: null,
            jobIdInterno: null,
            enviadoInterno: false,
            asuntoExterno: 'AE',
            cuerpoExterno: 'CE',
            fechaEnvioExterno: fecha,
            idTemplateExterno: null,
            jobIdExterno: null,
            enviadoExterno: false,
        });

        describe('toDomain', () => {
            it('should convert the record and sort instances by orden', () => {
                const record = {
                    id: 1,
                    tipo: 'SEGUIMIENTO',
                    estado: 'PROGRAMADA',
                    idActividad: 100,
                    idLead: 200,
                    idResponsable: 300,
                    asuntoInterno: null,
                    cuerpoInterno: null,
                    fechaEnvioInterno: null,
                    idTemplateInterno: null,
                    jobIdInterno: null,
                    enviadoInterno: false,
                    correoCliente: 'cliente@test.com',
                    instancias: [
                        buildInstanciaRecord(2, 11),
                        buildInstanciaRecord(1, 10),
                    ],
                    createdAt,
                    updatedAt,
                };

                const result = NotificationMapper.toDomain(record as any);

                expect(result).toBeInstanceOf(ScheduledNotification);
                expect(result.id).toBe(1);
                expect(result.tipo).toBe(NotificationType.SEGUIMIENTO);
                expect(result.estado).toBe(NotificationStatus.PROGRAMADA);
                expect(result.id_actividad).toBe(100);
                expect(result.id_lead).toBe(200);
                expect(result.id_responsable).toBe(300);
                expect(result.correo_cliente).toBe('cliente@test.com');
                expect(result.created_at).toEqual(createdAt);
                expect(result.updated_at).toEqual(updatedAt);
                expect(result.instancias).toHaveLength(2);
                // Sorted ascending by orden.
                expect(result.instancias[0].orden).toBe(1);
                expect(result.instancias[1].orden).toBe(2);
            });

            it('should map a reminder with flat internal fields and no instances', () => {
                const record = {
                    id: 2,
                    tipo: 'RECORDATORIO',
                    estado: 'VENCIDA',
                    idActividad: 101,
                    idLead: 201,
                    idResponsable: 301,
                    asuntoInterno: 'Recordatorio',
                    cuerpoInterno: 'Cuerpo',
                    fechaEnvioInterno: fecha,
                    idTemplateInterno: 9,
                    jobIdInterno: 'job-1',
                    enviadoInterno: true,
                    correoCliente: null,
                    instancias: [],
                    createdAt,
                    updatedAt,
                };

                const result = NotificationMapper.toDomain(record as any);

                expect(result.tipo).toBe(NotificationType.RECORDATORIO);
                expect(result.estado).toBe(NotificationStatus.VENCIDA);
                expect(result.asunto_interno).toBe('Recordatorio');
                expect(result.id_template_interno).toBe(9);
                expect(result.job_id_interno).toBe('job-1');
                expect(result.enviado_interno).toBe(true);
                expect(result.correo_cliente).toBeNull();
                expect(result.instancias).toHaveLength(0);
            });
        });

        describe('toCreateData', () => {
            it('should map a follow-up with connect relations and nested instances', () => {
                const instancia = new FollowUpInstance(
                    null,
                    1,
                    'AI',
                    'CI',
                    fecha,
                    null,
                    null,
                    false,
                    'AE',
                    'CE',
                    fecha,
                    null,
                    null,
                    false,
                );
                const notification = new ScheduledNotification(
                    null,
                    NotificationType.SEGUIMIENTO,
                    NotificationStatus.PROGRAMADA,
                    100,
                    200,
                    300,
                    null,
                    null,
                    null,
                    null,
                    null,
                    false,
                    'cliente@test.com',
                    [instancia],
                    createdAt,
                    updatedAt,
                );

                const result = NotificationMapper.toCreateData(notification);

                expect(result.tipo).toBe(NotificationType.SEGUIMIENTO);
                expect(result.estado).toBe(NotificationStatus.PROGRAMADA);
                expect(result.actividad).toEqual({ connect: { id: 100 } });
                expect(result.lead).toEqual({ connect: { id: 200 } });
                expect(result.responsable).toEqual({ connect: { id: 300 } });
                expect(result.correoCliente).toBe('cliente@test.com');
                expect((result.instancias as any).create).toHaveLength(1);
                expect((result.instancias as any).create[0].orden).toBe(1);
            });

            it('should produce an empty nested create array when there are no instances', () => {
                const notification = new ScheduledNotification(
                    null,
                    NotificationType.RECORDATORIO,
                    NotificationStatus.PROGRAMADA,
                    100,
                    200,
                    300,
                    'Asunto',
                    'Cuerpo',
                    fecha,
                    5,
                    null,
                    false,
                    null,
                    [],
                    createdAt,
                    updatedAt,
                );

                const result = NotificationMapper.toCreateData(notification);

                expect(result.asuntoInterno).toBe('Asunto');
                expect(result.idTemplateInterno).toBe(5);
                expect((result.instancias as any).create).toEqual([]);
            });
        });

        describe('toUpdateData', () => {
            it('should map only the mutable fields for an update', () => {
                const notification = new ScheduledNotification(
                    1,
                    NotificationType.RECORDATORIO,
                    NotificationStatus.VENCIDA,
                    100,
                    200,
                    300,
                    'Asunto',
                    'Cuerpo',
                    fecha,
                    5,
                    'job-x',
                    true,
                    'cliente@test.com',
                    [],
                    createdAt,
                    updatedAt,
                );

                const result = NotificationMapper.toUpdateData(notification);

                expect(result).toEqual({
                    estado: NotificationStatus.VENCIDA,
                    asuntoInterno: 'Asunto',
                    cuerpoInterno: 'Cuerpo',
                    fechaEnvioInterno: fecha,
                    jobIdInterno: 'job-x',
                    enviadoInterno: true,
                    correoCliente: 'cliente@test.com',
                });
            });
        });
    });
});
