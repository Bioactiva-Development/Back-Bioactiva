import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { DashboardController } from '@/modules/dashboard/infrastructure/http/dashboard.controller';
import { GetDashboardMetricsUseCase } from '@/modules/dashboard/application/use-cases/get-dashboard-metrics.use-case';
import { DashboardQueryDto } from '@/modules/dashboard/infrastructure/http/dtos/dashboard-query.dto';
import type { DashboardMetrics } from '@/modules/dashboard/domain/ports/dashboard-repository.port';

describe('Dashboard module', () => {
    describe('DashboardController', () => {
        let controller: DashboardController;
        let getDashboardMetricsUseCase: jest.Mocked<GetDashboardMetricsUseCase>;

        const mockMetrics: DashboardMetrics = {
            totalLeads: 100,
            averageTicketAmount: 5000,
            conversionRate: 25,
            avgClosingTimeDays: 30.5,
            proposalToCloseRate: 66.67,
            avgProposalStageDays: 15.2,
            avgActivitiesPerLead: 2.5,
            pipelineTotalAmount: 200000,
            closedRevenue: 45000,
            stalledLeadPercentage: 10,
            periodStart: new Date('2026-01-01'),
            periodEnd: new Date('2026-06-05'),
        };

        beforeEach(async () => {
            getDashboardMetricsUseCase = { execute: jest.fn() } as any;

            const module = await Test.createTestingModule({
                controllers: [DashboardController],
                providers: [
                    {
                        provide: GetDashboardMetricsUseCase,
                        useValue: getDashboardMetricsUseCase,
                    },
                ],
            }).compile();

            controller = module.get(DashboardController);
        });

        it('should return dashboard metrics with query params', async () => {
            getDashboardMetricsUseCase.execute.mockResolvedValue(mockMetrics);

            const query: DashboardQueryDto = {
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2026-06-05T23:59:59.000Z',
                idEncargado: 3,
            };
            const result = await controller.getMetrics(query);

            expect(getDashboardMetricsUseCase.execute).toHaveBeenCalledWith({
                startDate: new Date('2026-01-01T00:00:00.000Z'),
                endDate: new Date('2026-06-05T23:59:59.000Z'),
                idEncargado: 3,
            });
            expect(result.totalLeads).toBe(100);
            expect(result.conversionRate).toBe(25);
            expect(result.stalledLeadPercentage).toBe(10);
            expect(result.periodStart).toEqual(mockMetrics.periodStart);
            expect(result.periodEnd).toEqual(mockMetrics.periodEnd);
        });

        it('should handle empty query params', async () => {
            getDashboardMetricsUseCase.execute.mockResolvedValue(mockMetrics);

            const query: DashboardQueryDto = {};
            const result = await controller.getMetrics(query);

            expect(getDashboardMetricsUseCase.execute).toHaveBeenCalledWith({
                startDate: undefined,
                endDate: undefined,
                idEncargado: undefined,
            });
            expect(result).toBeDefined();
        });

        it('should return a DashboardResponseDto', async () => {
            getDashboardMetricsUseCase.execute.mockResolvedValue(mockMetrics);

            const result = await controller.getMetrics({});

            expect(result.constructor.name).toBe('DashboardResponseDto');
            expect(result.totalLeads).toBe(100);
            expect(result.averageTicketAmount).toBe(5000);
            expect(result.pipelineTotalAmount).toBe(200000);
            expect(result.closedRevenue).toBe(45000);
        });
    });
});
