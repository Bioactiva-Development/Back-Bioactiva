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
                internal: {
                    asunto: 'Interno',
                    cuerpo: 'Cuerpo interno',
                    fechaEnvio: new Date('2026-06-10T14:00:00.000Z'),
                    idTemplate: 5,
                },
                external: {
                    correoCliente: 'cliente@empresa.com',
                    asunto: 'Externo',
                    cuerpo: 'Cuerpo externo',
                    fechaEnvio: new Date('2026-06-10T16:00:00.000Z'),
                    idTemplate: 6,
                },
            });

        it('createReminder builds a PROGRAMADA reminder without external data', () => {
            const n = reminder();
            expect(n.id).toBeNull();
            expect(n.tipo).toBe(NotificationType.RECORDATORIO);
            expect(n.estado).toBe(NotificationStatus.PROGRAMADA);
            expect(n.enviado_interno).toBe(false);
            expect(n.correo_cliente).toBeNull();
            expect(n.isReminder()).toBe(true);
        });

        it('createFollowUp builds a SEGUIMIENTO with external data', () => {
            const n = followUp();
            expect(n.tipo).toBe(NotificationType.SEGUIMIENTO);
            expect(n.correo_cliente).toBe('cliente@empresa.com');
            expect(n.asunto_externo).toBe('Externo');
            expect(n.isFollowUp()).toBe(true);
            expect(n.hasPendingExternal()).toBe(true);
        });

        it('markInternalSent closes a reminder (VENCIDA)', () => {
            const n = reminder();
            n.markInternalSent();
            expect(n.enviado_interno).toBe(true);
            expect(n.estado).toBe(NotificationStatus.VENCIDA);
        });

        it('markInternalSent keeps a follow-up PROGRAMADA', () => {
            const n = followUp();
            n.markInternalSent();
            expect(n.enviado_interno).toBe(true);
            expect(n.estado).toBe(NotificationStatus.PROGRAMADA);
        });

        it('markExternalSent closes a follow-up (VENCIDA)', () => {
            const n = followUp();
            n.markInternalSent();
            n.markExternalSent();
            expect(n.enviado_externo).toBe(true);
            expect(n.estado).toBe(NotificationStatus.VENCIDA);
            expect(n.hasPendingExternal()).toBe(false);
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
            n.markInternalSent();
            n.completeFollowUp();
            expect(n.estado).toBe(NotificationStatus.VENCIDA);
        });
    });
});
