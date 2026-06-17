import { describe, expect, it } from '@jest/globals';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';
import { NotificationCannotBeCancelledException } from '@/modules/notifications/domain/exceptions/notification-cannot-be-cancelled.exception';

describe('Notifications module', () => {
    describe('ScheduledNotification entity', () => {
        const reminder = () =>
            ScheduledNotification.createReminder({
                idActividad: 1,
                idLead: 2,
                idResponsable: 3,
                internal: {
                    asunto: 'Asunto',
                    cuerpo: 'Cuerpo',
                    fechaEnvio: new Date('2026-06-10T14:00:00.000Z'),
                    idTemplate: 5,
                },
            });

        const followUp = () =>
            ScheduledNotification.createFollowUp({
                idActividad: 1,
                idLead: 2,
                idResponsable: 3,
                correoCliente: 'cliente@empresa.com',
                instancias: [
                    {
                        internal: {
                            asunto: 'I1',
                            cuerpo: 'I1',
                            fechaEnvio: new Date('2026-06-10T14:00:00.000Z'),
                            idTemplate: 5,
                        },
                        external: {
                            asunto: 'E1',
                            cuerpo: 'E1',
                            fechaEnvio: new Date('2026-06-10T16:00:00.000Z'),
                            idTemplate: 6,
                        },
                    },
                    {
                        internal: {
                            asunto: 'I2',
                            cuerpo: 'I2',
                            fechaEnvio: new Date('2026-06-11T14:00:00.000Z'),
                            idTemplate: 5,
                        },
                        external: {
                            asunto: 'E2',
                            cuerpo: 'E2',
                            fechaEnvio: new Date('2026-06-11T16:00:00.000Z'),
                            idTemplate: 6,
                        },
                    },
                ],
            });

        it('createReminder builds a PROGRAMADA reminder without external data', () => {
            const n = reminder();
            expect(n.id).toBeNull();
            expect(n.tipo).toBe(NotificationType.RECORDATORIO);
            expect(n.estado).toBe(NotificationStatus.PROGRAMADA);
            expect(n.enviado_interno).toBe(false);
            expect(n.correo_cliente).toBeNull();
            expect(n.instancias).toHaveLength(0);
            expect(n.isReminder()).toBe(true);
        });

        it('createFollowUp builds a SEGUIMIENTO with ordered instances', () => {
            const n = followUp();
            expect(n.tipo).toBe(NotificationType.SEGUIMIENTO);
            expect(n.correo_cliente).toBe('cliente@empresa.com');
            expect(n.asunto_interno).toBeNull();
            expect(n.instancias).toHaveLength(2);
            expect(n.instancias.map((i) => i.orden)).toEqual([1, 2]);
            expect(n.instancias[0].asunto_externo).toBe('E1');
            expect(n.isFollowUp()).toBe(true);
        });

        it('markInternalSent closes a reminder (VENCIDA)', () => {
            const n = reminder();
            n.markInternalSent();
            expect(n.enviado_interno).toBe(true);
            expect(n.estado).toBe(NotificationStatus.VENCIDA);
        });

        it('closeIfAllInstancesSent keeps the follow-up PROGRAMADA until every instance is sent', () => {
            const n = followUp();
            n.instancias[0].markInternalSent();
            n.instancias[0].markExternalSent();
            n.closeIfAllInstancesSent();
            expect(n.estado).toBe(NotificationStatus.PROGRAMADA);

            n.instancias[1].markInternalSent();
            n.instancias[1].markExternalSent();
            n.closeIfAllInstancesSent();
            expect(n.estado).toBe(NotificationStatus.VENCIDA);
        });

        it('pendingInstanceJobIds returns only jobs of unsent instances', () => {
            const n = followUp();
            n.instancias.forEach((instancia, index) => {
                instancia.assignInternalJob(`seg-internal-${index}`);
                instancia.assignExternalJob(`seg-external-${index}`);
            });
            n.instancias[0].markInternalSent();

            expect(n.pendingInstanceJobIds()).toEqual([
                'seg-external-0',
                'seg-internal-1',
                'seg-external-1',
            ]);
        });

        it('cancel moves a PROGRAMADA notification to CANCELADA', () => {
            const n = reminder();
            n.cancel();
            expect(n.estado).toBe(NotificationStatus.CANCELADA);
        });

        it('cancel throws when already executed (VENCIDA)', () => {
            const n = reminder();
            n.markInternalSent();
            expect(() => n.cancel()).toThrow(
                NotificationCannotBeCancelledException,
            );
        });

        it('completeFollowUp closes a pending follow-up', () => {
            const n = followUp();
            n.completeFollowUp();
            expect(n.estado).toBe(NotificationStatus.VENCIDA);
        });
    });
});
