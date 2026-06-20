import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateFollowUpUseCase } from '@/modules/notifications/application/use-cases/create-follow-up.use-case';
import { LeadHasNoActiveActivityException } from '@/modules/notifications/domain/exceptions/lead-has-no-active-activity.exception';

/**
 * Branch coverage extra:
 *  - `if (previousExternal)` lado FALSY: un seguimiento de una sola instancia
 *    nunca tiene "external previo" en la primera (y única) iteración.
 *  - `if (!context)` true: lead sin actividad activa.
 */
describe('Notifications module — CreateFollowUpUseCase branches2', () => {
    let useCase: CreateFollowUpUseCase;
    let repository: any;
    let scheduler: any;
    let templateReader: any;
    let contextReader: any;

    const context = {
        idActividad: 1,
        idLead: 2,
        idResponsable: 3,
        responsableEmail: 'resp@bioactiva.com',
        fechaFin: new Date('2099-01-10T14:00:00.000Z'),
        estado: 'PENDIENTE',
        contactEmails: ['cliente@empresa.com'],
    };

    const command = () => ({
        idLead: 2,
        correoCliente: 'cliente@empresa.com',
        instancias: [
            {
                internal: {
                    fechaEnvio: new Date(2099, 0, 1, 10, 0, 0),
                    idTemplate: 5 as number | null,
                    asunto: 'Interno',
                    cuerpo: 'Cuerpo interno',
                },
                external: {
                    fechaEnvio: new Date(2099, 0, 1, 11, 0, 0),
                    idTemplate: 6 as number | null,
                    asunto: 'Externo',
                    cuerpo: 'Cuerpo externo',
                },
            },
        ],
    });

    beforeEach(() => {
        repository = {
            save: jest.fn(async (n: any) => {
                if (n.id === null) {
                    n.id = 20;
                    n.instancias.forEach((inst: any, i: number) => {
                        if (inst.id === null) {
                            inst.id = 100 + i;
                        }
                    });
                }
                return n;
            }),
            findActiveByActivity: jest.fn().mockResolvedValue(null),
        };
        scheduler = {
            scheduleInstanceInternal: jest
                .fn()
                .mockResolvedValue('seg-internal-100'),
            scheduleInstanceExternal: jest
                .fn()
                .mockResolvedValue('seg-external-100'),
        };
        templateReader = {
            findActiveById: jest.fn().mockResolvedValue({ id: 1, activo: true }),
        };
        contextReader = {
            getActiveActivityByLead: jest.fn().mockResolvedValue(context),
        };
        useCase = new CreateFollowUpUseCase(
            repository,
            scheduler,
            templateReader,
            contextReader,
        );
    });

    it('schedules a single-instance follow-up (no previous external)', async () => {
        const result = await useCase.execute(command());

        expect(result.instancias).toHaveLength(1);
        expect(scheduler.scheduleInstanceInternal).toHaveBeenCalledTimes(1);
        expect(scheduler.scheduleInstanceExternal).toHaveBeenCalledTimes(1);
    });

    it('throws when the lead has no active activity', async () => {
        contextReader.getActiveActivityByLead.mockResolvedValue(null);
        await expect(useCase.execute(command())).rejects.toThrow(
            LeadHasNoActiveActivityException,
        );
    });
});
