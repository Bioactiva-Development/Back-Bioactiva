import { describe, expect, it } from '@jest/globals';
import { GetDashboardMetricsUseCase } from '@/modules/dashboard/application/use-cases/get-dashboard-metrics.use-case';
import type { DashboardMetrics, DashboardRepositoryPort } from '@/modules/dashboard/domain/ports/dashboard-repository.port';

describe('Dashboard module', () => {
    describe('GetDashboardMetricsUseCase', () => {
        const mockMetrics: DashboardMetrics = {
            totalLeads: 100,
            averageTicketAmount: { pen: 5000, usd: 1300 },
            conversionRate: 25,
            avgClosingTimeDays: 30,
            proposalToCloseRate: 60,
            avgProposalStageDays: 15,
            avgActivitiesPerLead: 3.5,
            pipelineTotalAmount: { pen: 200000, usd: 50000 },
            closedRevenue: { pen: 45000, usd: 12000 },
            stalledLeadPercentage: 10,
            periodStart: new Date('2026-01-01'),
            periodEnd: new Date('2026-06-05'),
        };

        it('should delegate to repository with the given query', async () => {
            const repository: DashboardRepositoryPort = {
                getMetrics: jest.fn<(query: any) => Promise<DashboardMetrics>>().mockResolvedValue(mockMetrics),
            };
            const useCase = new GetDashboardMetricsUseCase(repository);

            const query = { startDate: new Date('2026-01-01'), endDate: new Date('2026-06-05'), idEncargado: 1 };
            const result = await useCase.execute(query);

            expect(repository.getMetrics).toHaveBeenCalledWith(query);
            expect(result).toEqual(mockMetrics);
        });

        it('should pass empty query when no filters are provided', async () => {
            const repository: DashboardRepositoryPort = {
                getMetrics: jest.fn<(query: any) => Promise<DashboardMetrics>>().mockResolvedValue(mockMetrics),
            };
            const useCase = new GetDashboardMetricsUseCase(repository);

            await useCase.execute({});

            expect(repository.getMetrics).toHaveBeenCalledWith({});
        });
    });
});
