import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { PrismaDashboardRepository } from '@/modules/dashboard/infrastructure/persistance/prisma-dashboard.repository';

describe('Dashboard module', () => {
    describe('PrismaDashboardRepository', () => {
        let repository: PrismaDashboardRepository;
        let mockPrisma: any;

        const defaultQuery = {
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-06-05'),
        };

        // Las métricas se consolidan en 3 consultas:
        //   1. $queryRawUnsafe -> agregados de Lead (getLeadAggregates)
        //   2. $queryRawUnsafe -> agregados de Cotizacion (getQuotationAggregates)
        //   3. actividad.count -> nº de actividades
        // Como se lanzan con Promise.all, el orden de resolución no está
        // garantizado: distinguimos cada consulta raw por el SQL recibido.
        function stubRawQueries(
            leadRow: Record<string, unknown>,
            quotationRow: Record<string, unknown>,
        ) {
            mockPrisma.$queryRawUnsafe.mockImplementation((sql: string) => {
                if (sql.includes('FROM "Lead"')) {
                    return Promise.resolve([leadRow]);
                }
                if (sql.includes('FROM "Cotizacion"')) {
                    return Promise.resolve([quotationRow]);
                }
                return Promise.resolve([{}]);
            });
        }

        beforeEach(() => {
            mockPrisma = {
                actividad: { count: jest.fn() },
                $queryRawUnsafe: jest.fn(),
            };
            repository = new PrismaDashboardRepository(mockPrisma as any);
        });

        describe('getMetrics with complete data', () => {
            it('should compute all 10 KPI fields correctly', async () => {
                stubRawQueries(
                    {
                        total_leads: '100',
                        closed_count: '20',
                        lost_count: '10',
                        avg_closing_days: '30.5',
                        avg_proposal_days: '15.2',
                        stalled_count: '15',
                    },
                    {
                        pipeline_total: '200000',
                        closed_total: '45000',
                        closed_avg_ticket: '2250',
                    },
                );
                mockPrisma.actividad.count.mockResolvedValue(250);

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

        describe('query count', () => {
            it('should issue exactly 3 queries regardless of idEncargado', async () => {
                stubRawQueries(
                    {
                        total_leads: '50',
                        closed_count: '0',
                        lost_count: '0',
                        avg_closing_days: null,
                        avg_proposal_days: null,
                        stalled_count: '0',
                    },
                    {
                        pipeline_total: '0',
                        closed_total: '0',
                        closed_avg_ticket: '0',
                    },
                );
                mockPrisma.actividad.count.mockResolvedValue(0);

                await repository.getMetrics({ ...defaultQuery, idEncargado: 5 });

                // 2 consultas raw + 1 actividad.count = 3 (antes hasta 13).
                expect(mockPrisma.$queryRawUnsafe.mock.calls).toHaveLength(2);
                expect(mockPrisma.actividad.count.mock.calls).toHaveLength(1);
            });

            it('should parameterize idEncargado on both raw queries', async () => {
                stubRawQueries(
                    { total_leads: '0' },
                    { pipeline_total: '0' },
                );
                mockPrisma.actividad.count.mockResolvedValue(0);

                await repository.getMetrics({ ...defaultQuery, idEncargado: 7 });

                for (const call of mockPrisma.$queryRawUnsafe.mock.calls) {
                    const [sql, ...params] = call;
                    expect(sql).toContain('l."idEncargado" = $');
                    expect(params).toContain(7);
                }
                // actividad.count recibe idEncargado en el filtro de relación.
                const activityArg =
                    mockPrisma.actividad.count.mock.calls[0][0];
                expect(activityArg.where.lead.idEncargado).toBe(7);
            });
        });

        describe('getMetrics with empty database', () => {
            it('should return zeros when no data exists', async () => {
                stubRawQueries(
                    {
                        total_leads: '0',
                        closed_count: '0',
                        lost_count: '0',
                        avg_closing_days: null,
                        avg_proposal_days: null,
                        stalled_count: '0',
                    },
                    {
                        pipeline_total: '0',
                        closed_total: '0',
                        closed_avg_ticket: '0',
                    },
                );
                mockPrisma.actividad.count.mockResolvedValue(0);

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
            it('should not divide by zero on 0 leads', async () => {
                stubRawQueries(
                    { total_leads: '0', stalled_count: '0' },
                    { pipeline_total: '0' },
                );
                mockPrisma.actividad.count.mockResolvedValue(0);

                const result = await repository.getMetrics(defaultQuery);

                expect(result.stalledLeadPercentage).toBe(0);
                expect(result.avgActivitiesPerLead).toBe(0);
                expect(result.conversionRate).toBe(0);
            });

            it('should handle 0 closed leads', async () => {
                stubRawQueries(
                    {
                        total_leads: '10',
                        closed_count: '0',
                        lost_count: '0',
                        stalled_count: '2',
                    },
                    {
                        pipeline_total: '0',
                        closed_total: '0',
                        closed_avg_ticket: '0',
                    },
                );
                mockPrisma.actividad.count.mockResolvedValue(0);

                const result = await repository.getMetrics(defaultQuery);

                expect(result.conversionRate).toBe(0);
                expect(result.proposalToCloseRate).toBe(0);
                expect(result.averageTicketAmount).toBe(0);
            });

            it('should compute stalledLeadPercentage correctly', async () => {
                stubRawQueries(
                    {
                        total_leads: '40',
                        closed_count: '0',
                        lost_count: '0',
                        stalled_count: '10',
                    },
                    { pipeline_total: '0' },
                );
                mockPrisma.actividad.count.mockResolvedValue(0);

                const result = await repository.getMetrics(defaultQuery);

                expect(result.stalledLeadPercentage).toBe(25);
            });
        });
    });
});
