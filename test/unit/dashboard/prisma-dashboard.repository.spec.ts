import { describe, expect, it, beforeEach } from '@jest/globals';
import { PrismaDashboardRepository } from '@/modules/dashboard/infrastructure/persistance/prisma-dashboard.repository';

describe('Dashboard module', () => {
    describe('PrismaDashboardRepository', () => {
        let repository: PrismaDashboardRepository;
        let mockPrisma: any;

        const defaultQuery = {
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-06-05'),
        };

        beforeEach(() => {
            mockPrisma = {
                lead: {
                    count: jest.fn(),
                    groupBy: jest.fn(),
                },
                actividad: {
                    count: jest.fn(),
                },
                $queryRawUnsafe: jest.fn(),
            };
            repository = new PrismaDashboardRepository(mockPrisma as any);
        });

        describe('getMetrics with complete data', () => {
            it('should compute all 10 KPI fields correctly', async () => {
                // lead.count: totalLeads(100), stalledTotal(100), stalledCount(15) = 3 calls
                mockPrisma.lead.count
                    .mockResolvedValueOnce(100)
                    .mockResolvedValueOnce(100)
                    .mockResolvedValueOnce(15);

                mockPrisma.lead.groupBy.mockResolvedValue([
                    { estado: 'CIERRE_CON_VENTA', _count: { id: 20 } },
                    { estado: 'CIERRE_SIN_VENTA', _count: { id: 10 } },
                    { estado: 'OFERTADO', _count: { id: 30 } },
                    { estado: 'EN_PROSPECTO', _count: { id: 40 } },
                ]);

                mockPrisma.actividad.count.mockResolvedValue(250);

                // 4 raw queries, no encargado filter = 1 call each, issued in this order:
                // getAvgClosingTime, getAvgProposalStageTime, getPipelineAmount, getClosedRevenue.
                // (conversionRate/proposalToCloseRate come from lead.groupBy, not a raw query.)
                mockPrisma.$queryRawUnsafe
                    .mockResolvedValueOnce([{ avg_days: '30.5' }])
                    .mockResolvedValueOnce([{ avg_days: '15.2' }])
                    .mockResolvedValueOnce([{ total: '200000' }])
                    .mockResolvedValueOnce([{ total: '45000', avg_ticket: '2250' }]);

                const result = await repository.getMetrics(defaultQuery);

                expect(result.totalLeads).toBe(100);
                expect(result.averageTicketAmount).toBe(2250);
                expect(result.conversionRate).toBe(20);
                expect(result.avgClosingTimeDays).toBe(30.5);
                expect(result.proposalToCloseRate).toBeCloseTo(66.67, 1);
                expect(result.avgProposalStageDays).toBe(15.2);
                expect(result.avgActivitiesPerLead).toBe(2.5);
                expect(result.pipelineTotalAmount).toBe(200000);
                expect(result.closedRevenue).toBe(45000);
                expect(result.stalledLeadPercentage).toBe(15);
                expect(result.periodStart).toEqual(defaultQuery.startDate);
                expect(result.periodEnd).toEqual(defaultQuery.endDate);
            });
        });

        describe('getMetrics with idEncargado filter', () => {
            it('should double raw query count when idEncargado is set', async () => {
                const queryWithEncargado = { ...defaultQuery, idEncargado: 5 };

                mockPrisma.lead.count
                    .mockResolvedValueOnce(50)
                    .mockResolvedValueOnce(50)
                    .mockResolvedValueOnce(0);

                mockPrisma.lead.groupBy.mockResolvedValue([]);
                mockPrisma.actividad.count.mockResolvedValue(0);

                // When idEncargado is truthy, each raw method calls $queryRawUnsafe TWICE
                // (unfiltered first, then filtered). 4 raw methods x 2 = 8 calls.
                // Promise.all interleaves execution, so use mockResolvedValue (not Once)
                // so every call gets the same response regardless of order.
                mockPrisma.$queryRawUnsafe.mockResolvedValue([
                    { avg_days: null, total: '0', avg_ticket: '0', closed_count: '0', total_decided: '0' },
                ]);

                const result = await repository.getMetrics(queryWithEncargado);

                expect(mockPrisma.$queryRawUnsafe.mock.calls).toHaveLength(8);
                expect(result.averageTicketAmount).toBe(0);
                expect(result.avgClosingTimeDays).toBe(0);
                expect(result.proposalToCloseRate).toBe(0);
                expect(result.avgProposalStageDays).toBe(0);
                expect(result.pipelineTotalAmount).toBe(0);
                expect(result.closedRevenue).toBe(0);
            });
        });

        describe('getMetrics with empty database', () => {
            it('should return zeros when no data exists', async () => {
                mockPrisma.lead.count.mockResolvedValue(0);
                mockPrisma.lead.groupBy.mockResolvedValue([]);
                mockPrisma.actividad.count.mockResolvedValue(0);
                for (let i = 0; i < 5; i++) {
                    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([
                        { avg_days: null, total: null, avg_ticket: null, closed_count: null, total_decided: null },
                    ]);
                }

                const result = await repository.getMetrics(defaultQuery);

                expect(result.totalLeads).toBe(0);
                expect(result.averageTicketAmount).toBe(0);
                expect(result.conversionRate).toBe(0);
                expect(result.avgClosingTimeDays).toBe(0);
                expect(result.proposalToCloseRate).toBe(0);
                expect(result.avgProposalStageDays).toBe(0);
                expect(result.avgActivitiesPerLead).toBe(0);
                expect(result.pipelineTotalAmount).toBe(0);
                expect(result.closedRevenue).toBe(0);
                expect(result.stalledLeadPercentage).toBe(0);
            });
        });

        describe('getMetrics edge cases', () => {
            it('should not stall on 0 leads', async () => {
                mockPrisma.lead.count.mockResolvedValue(0);
                mockPrisma.lead.groupBy.mockResolvedValue([]);
                mockPrisma.actividad.count.mockResolvedValue(0);
                for (let i = 0; i < 5; i++) {
                    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([
                        { avg_days: null, total: null, avg_ticket: null, closed_count: null, total_decided: null },
                    ]);
                }

                const result = await repository.getMetrics(defaultQuery);

                expect(result.stalledLeadPercentage).toBe(0);
            });

            it('should handle 0 closed leads', async () => {
                // lead.count: totalLeads(10), stalledTotal(10), stalledCount(2)
                mockPrisma.lead.count
                    .mockResolvedValueOnce(10)
                    .mockResolvedValueOnce(10)
                    .mockResolvedValueOnce(2);

                mockPrisma.lead.groupBy.mockResolvedValue([
                    { estado: 'OFERTADO', _count: { id: 5 } },
                    { estado: 'EN_PROSPECTO', _count: { id: 5 } },
                ]);
                mockPrisma.actividad.count.mockResolvedValue(0);
                mockPrisma.$queryRawUnsafe
                    .mockResolvedValueOnce([{ avg_days: null }])
                    .mockResolvedValueOnce([{ closed_count: '0', total_decided: '0' }])
                    .mockResolvedValueOnce([{ avg_days: null }])
                    .mockResolvedValueOnce([{ total: '0' }])
                    .mockResolvedValueOnce([{ total: '0', avg_ticket: '0' }]);

                const result = await repository.getMetrics(defaultQuery);

                expect(result.conversionRate).toBe(0);
                expect(result.proposalToCloseRate).toBe(0);
                expect(result.averageTicketAmount).toBe(0);
            });

            it('should compute stalledLeadPercentage correctly', async () => {
                mockPrisma.lead.count
                    .mockResolvedValueOnce(40)
                    .mockResolvedValueOnce(40)
                    .mockResolvedValueOnce(10);

                mockPrisma.lead.groupBy.mockResolvedValue([
                    { estado: 'EN_PROSPECTO', _count: { id: 40 } },
                ]);

                mockPrisma.actividad.count.mockResolvedValue(0);
                mockPrisma.$queryRawUnsafe
                    .mockResolvedValueOnce([{ avg_days: null }])
                    .mockResolvedValueOnce([{ closed_count: '0', total_decided: '10' }])
                    .mockResolvedValueOnce([{ avg_days: null }])
                    .mockResolvedValueOnce([{ total: '0' }])
                    .mockResolvedValueOnce([{ total: '0', avg_ticket: '0' }]);

                const result = await repository.getMetrics(defaultQuery);

                expect(result.stalledLeadPercentage).toBe(25);
            });
        });
    });
});
