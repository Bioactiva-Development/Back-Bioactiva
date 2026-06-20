import { describe, expect, it } from '@jest/globals';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';

/**
 * Branch coverage extra para `pendingInstanceJobIds`:
 * `if (instancia.hasPendingExternal() && instancia.job_id_externo)`
 *  - hasPendingExternal false               -> no incluye el job externo.
 *  - hasPendingExternal true + sin job_id   -> no incluye el job externo.
 */
describe('Notifications module — ScheduledNotification branches2', () => {
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
                        fechaEnvio: new Date('2099-01-10T14:00:00.000Z'),
                        idTemplate: 5,
                    },
                    external: {
                        asunto: 'E1',
                        cuerpo: 'E1',
                        fechaEnvio: new Date('2099-01-10T16:00:00.000Z'),
                        idTemplate: 6,
                    },
                },
            ],
        });

    it('excludes the external job when the external email was already sent', () => {
        const n = followUp();
        const instancia = n.instancias[0];
        instancia.assignInternalJob('int-1');
        instancia.assignExternalJob('ext-1');
        instancia.markExternalSent();

        const jobIds = n.pendingInstanceJobIds();

        // El interno sigue pendiente; el externo ya se envió.
        expect(jobIds).toContain('int-1');
        expect(jobIds).not.toContain('ext-1');
    });

    it('excludes the external job when there is no external job id assigned', () => {
        const n = followUp();
        const instancia = n.instancias[0];
        instancia.assignInternalJob('int-1');
        // job_id_externo permanece null aunque el externo siga pendiente.

        const jobIds = n.pendingInstanceJobIds();

        expect(jobIds).toEqual(['int-1']);
    });
});
