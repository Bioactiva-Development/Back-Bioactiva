import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GenerateStaleLeadAlertsUseCase } from '@/modules/notifications/application/use-cases/generate-stale-lead-alerts.use-case';

describe('Notifications module', () => {
    describe('GenerateStaleLeadAlertsUseCase', () => {
        let useCase: GenerateStaleLeadAlertsUseCase;
        let staleLeadReader: any;
        let inAppRepository: any;

        const staleLeads = [
            {
                idLead: 1,
                idEncargado: 10,
                ultimoCambioEstado: new Date('2026-01-01'),
            },
            {
                idLead: 2,
                idEncargado: 20,
                ultimoCambioEstado: new Date('2026-01-02'),
            },
        ];

        beforeEach(() => {
            staleLeadReader = {
                getStaleLeads: jest.fn().mockResolvedValue(staleLeads),
            };
            inAppRepository = {
                // Por defecto ningún lead tiene alerta reciente.
                findLeadIdsWithRecentAlert: jest.fn().mockResolvedValue([]),
                // createMany devuelve cuántas notificaciones recibió.
                createMany: jest
                    .fn()
                    .mockImplementation((arr: unknown[]) =>
                        Promise.resolve(arr.length),
                    ),
            };
            useCase = new GenerateStaleLeadAlertsUseCase(
                staleLeadReader,
                inAppRepository,
            );
        });

        it('creates one alert per stale lead addressed to its encargado', async () => {
            const result = await useCase.execute();

            expect(result.created).toBe(2);
            // Un único INSERT masivo con las dos alertas.
            expect(inAppRepository.createMany).toHaveBeenCalledTimes(1);
            const alerts = inAppRepository.createMany.mock.calls[0][0];
            expect(alerts).toHaveLength(2);
            expect(alerts[0].id_usuario).toBe(10);
            expect(alerts[0].id_lead).toBe(1);
        });

        it('skips leads already alerted within the window', async () => {
            // El lead 1 ya tiene alerta reciente; solo debe crearse la del 2.
            inAppRepository.findLeadIdsWithRecentAlert.mockResolvedValue([1]);

            const result = await useCase.execute();

            expect(result.created).toBe(1);
            const alerts = inAppRepository.createMany.mock.calls[0][0];
            expect(alerts).toHaveLength(1);
            expect(alerts[0].id_lead).toBe(2);
        });

        it('checks recent alerts with a single batched query', async () => {
            await useCase.execute();

            expect(
                inAppRepository.findLeadIdsWithRecentAlert,
            ).toHaveBeenCalledTimes(1);
            expect(
                inAppRepository.findLeadIdsWithRecentAlert.mock.calls[0][0],
            ).toEqual([1, 2]);
        });

        it('creates nothing when there are no stale leads', async () => {
            staleLeadReader.getStaleLeads.mockResolvedValue([]);

            const result = await useCase.execute();

            expect(result.created).toBe(0);
            expect(
                inAppRepository.findLeadIdsWithRecentAlert,
            ).not.toHaveBeenCalled();
            expect(inAppRepository.createMany).not.toHaveBeenCalled();
        });
    });
});
