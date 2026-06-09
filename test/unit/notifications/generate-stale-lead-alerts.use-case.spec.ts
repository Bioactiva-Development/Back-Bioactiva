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
                hasRecentLeadAlert: jest.fn().mockResolvedValue(false),
                create: jest.fn(),
            };
            useCase = new GenerateStaleLeadAlertsUseCase(
                staleLeadReader,
                inAppRepository,
            );
        });

        it('creates one alert per stale lead addressed to its encargado', async () => {
            const result = await useCase.execute();

            expect(result.created).toBe(2);
            expect(inAppRepository.create).toHaveBeenCalledTimes(2);
            const firstAlert = inAppRepository.create.mock.calls[0][0];
            expect(firstAlert.id_usuario).toBe(10);
            expect(firstAlert.id_lead).toBe(1);
        });

        it('skips leads already alerted within the window', async () => {
            inAppRepository.hasRecentLeadAlert.mockImplementation(
                async (idLead: number) => idLead === 1,
            );

            const result = await useCase.execute();

            expect(result.created).toBe(1);
            expect(inAppRepository.create).toHaveBeenCalledTimes(1);
            expect(inAppRepository.create.mock.calls[0][0].id_lead).toBe(2);
        });

        it('creates nothing when there are no stale leads', async () => {
            staleLeadReader.getStaleLeads.mockResolvedValue([]);

            const result = await useCase.execute();

            expect(result.created).toBe(0);
            expect(inAppRepository.create).not.toHaveBeenCalled();
        });
    });
});
