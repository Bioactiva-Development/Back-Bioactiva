import { describe, expect, it } from '@jest/globals';
import {
    NotificationResponseDto,
    FollowUpInstanceResponseDto,
} from '@/modules/notifications/infrastructure/http/dto/notification-response.dto';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';

describe('Notifications module', () => {
    describe('NotificationResponseDto — mapping branches', () => {
        it('maps a follow-up with null internal fields and a populated client email', () => {
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
            // SEGUIMIENTO has no internal flat fields.
            expect(dto.asuntoInterno).toBeNull();
            expect(dto.fechaEnvioInterno).toBeNull();
            expect(dto.correoCliente).toBe('cliente@empresa.com');
            expect(dto.instancias).toHaveLength(1);
        });

        it('maps a fully-sent instance directly', () => {
            const instancia = new FollowUpInstance(
                9,
                1,
                'AI',
                'CI',
                new Date('2099-01-01T00:00:00.000Z'),
                3,
                'job-int',
                true,
                'AE',
                'CE',
                new Date('2099-01-02T00:00:00.000Z'),
                4,
                'job-ext',
                true,
            );

            const dto = new FollowUpInstanceResponseDto(instancia);

            expect(dto.id).toBe(9);
            expect(dto.enviadoInterno).toBe(true);
            expect(dto.enviadoExterno).toBe(true);
            expect(dto.fechaEnvioExterno).toBeInstanceOf(Date);
        });
    });
});
