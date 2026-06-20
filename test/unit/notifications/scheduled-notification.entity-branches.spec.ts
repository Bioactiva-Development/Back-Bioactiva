import { describe, expect, it } from '@jest/globals';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';

describe('Notifications module', () => {
    describe('ScheduledNotification entity — branches', () => {
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
                ],
            });

        it('assignInternalJob stores the job id and bumps updated_at', () => {
            const n = reminder();
            n.assignInternalJob('job-int-1');
            expect(n.job_id_interno).toBe('job-int-1');
        });

        it('singleInstance returns the only instance of a follow-up', () => {
            const n = followUp();
            expect(n.singleInstance()).toBe(n.instancias[0]);
        });

        it('singleInstance returns null for a reminder (not a follow-up)', () => {
            expect(reminder().singleInstance()).toBeNull();
        });

        it('singleInstance returns null for a follow-up with no instances', () => {
            const n = followUp();
            n.instancias = [];
            expect(n.singleInstance()).toBeNull();
        });

        it('isFollowUpEditable is true for a PROGRAMADA follow-up fully pending', () => {
            expect(followUp().isFollowUpEditable()).toBe(true);
        });

        it('isFollowUpEditable is false when the instance already sent an email', () => {
            const n = followUp();
            n.instancias[0].markInternalSent();
            expect(n.isFollowUpEditable()).toBe(false);
        });

        it('isFollowUpEditable is false when the status is not PROGRAMADA', () => {
            const n = followUp();
            n.estado = NotificationStatus.CANCELADA;
            expect(n.isFollowUpEditable()).toBe(false);
        });

        it('isFollowUpEditable is false for a reminder (no instance)', () => {
            expect(reminder().isFollowUpEditable()).toBe(false);
        });

        it('updateClientEmail overwrites the client email', () => {
            const n = followUp();
            n.updateClientEmail('otro@empresa.com');
            expect(n.correo_cliente).toBe('otro@empresa.com');
        });

        it('markInternalSent on a follow-up does not move it to VENCIDA', () => {
            const n = followUp();
            n.markInternalSent();
            expect(n.enviado_interno).toBe(true);
            expect(n.estado).toBe(NotificationStatus.PROGRAMADA);
        });

        it('completeFollowUp returns early when the status is not PROGRAMADA', () => {
            const n = followUp();
            n.estado = NotificationStatus.CANCELADA;
            n.completeFollowUp();
            expect(n.estado).toBe(NotificationStatus.CANCELADA);
        });
    });
});
