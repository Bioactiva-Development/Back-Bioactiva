import { describe, expect, it } from '@jest/globals';
import { InAppNotificationMapper } from '@/modules/notifications/infrastructure/persistance/mappers/in-app-notification.mapper';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationStatus } from '@/modules/notifications/domain/enums/in-app-notification-status';

describe('Notifications module', () => {
    describe('InAppNotificationMapper', () => {
        const createdAt = new Date('2024-01-01T00:00:00Z');

        describe('toDomain', () => {
            it('should convert a Prisma record into the domain entity', () => {
                const record = {
                    id: 5,
                    titulo: 'Lead estancado',
                    mensaje: 'Han pasado 7 dias',
                    estado: 'NO_LEIDA',
                    idUsuario: 10,
                    idActividad: 20,
                    idLead: 30,
                    createdAt,
                };

                const result = InAppNotificationMapper.toDomain(record as any);

                expect(result).toBeInstanceOf(InAppNotification);
                expect(result.id).toBe(5);
                expect(result.titulo).toBe('Lead estancado');
                expect(result.mensaje).toBe('Han pasado 7 dias');
                expect(result.estado).toBe(InAppNotificationStatus.NO_LEIDA);
                expect(result.id_usuario).toBe(10);
                expect(result.id_actividad).toBe(20);
                expect(result.id_lead).toBe(30);
                expect(result.created_at).toEqual(createdAt);
            });

            it('should preserve null optional foreign keys and the LEIDA status', () => {
                const record = {
                    id: 6,
                    titulo: 'Otro',
                    mensaje: 'Mensaje',
                    estado: 'LEIDA',
                    idUsuario: 11,
                    idActividad: null,
                    idLead: null,
                    createdAt,
                };

                const result = InAppNotificationMapper.toDomain(record as any);

                expect(result.estado).toBe(InAppNotificationStatus.LEIDA);
                expect(result.id_actividad).toBeNull();
                expect(result.id_lead).toBeNull();
            });
        });

        describe('toCreateData', () => {
            it('should map the domain entity to the Prisma create payload', () => {
                const notification = new InAppNotification(
                    null,
                    'Titulo',
                    'Mensaje',
                    InAppNotificationStatus.NO_LEIDA,
                    10,
                    20,
                    30,
                    createdAt,
                );

                const result =
                    InAppNotificationMapper.toCreateData(notification);

                expect(result).toEqual({
                    titulo: 'Titulo',
                    mensaje: 'Mensaje',
                    estado: InAppNotificationStatus.NO_LEIDA,
                    idUsuario: 10,
                    idActividad: 20,
                    idLead: 30,
                });
            });

            it('should keep null optional foreign keys in the create payload', () => {
                const notification = InAppNotification.createLeadAlert({
                    idUsuario: 10,
                    idLead: 30,
                    titulo: 'Titulo',
                    mensaje: 'Mensaje',
                });

                const result =
                    InAppNotificationMapper.toCreateData(notification);

                expect(result.idActividad).toBeNull();
                expect(result.idLead).toBe(30);
                expect(result.estado).toBe(InAppNotificationStatus.NO_LEIDA);
            });
        });
    });
});
