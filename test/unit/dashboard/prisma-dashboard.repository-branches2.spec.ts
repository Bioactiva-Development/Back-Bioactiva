import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { PrismaDashboardRepository } from '@/modules/dashboard/infrastructure/persistance/prisma-dashboard.repository';

/**
 * Branch coverage extra:
 * - getMetrics: usa los defaults de fecha (`?? new Date(...)`) cuando la query
 *   omite startDate/endDate.
 * - getLeadAggregates / getQuotationAggregates: `rows[0] ?? {}` y `?? 0` cuando
 *   $queryRawUnsafe devuelve un arreglo vacío.
 */
describe('Dashboard module — PrismaDashboardRepository branches2', () => {
    let repository: PrismaDashboardRepository;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            actividad: { count: jest.fn() },
            $queryRawUnsafe: jest.fn(),
        };
        repository = new PrismaDashboardRepository(mockPrisma as any);
    });

    it('falls back to default dates and zeroes when raw queries return empty arrays', async () => {
        // Ambas consultas raw devuelven [] -> rows[0] ?? {} y Number(... ?? 0).
        mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
        mockPrisma.actividad.count.mockResolvedValue(0);

        const metrics = await repository.getMetrics({} as any);

        expect(metrics.totalLeads).toBe(0);
        expect(metrics.averageTicketAmount).toBe(0);
        expect(metrics.closedRevenue).toBe(0);
        expect(metrics.pipelineTotalAmount).toBe(0);
        expect(metrics.conversionRate).toBe(0);
        expect(metrics.avgClosingTimeDays).toBe(0);
        expect(metrics.stalledLeadPercentage).toBe(0);
        // Defaults de fecha aplicados.
        expect(metrics.periodStart).toBeInstanceOf(Date);
        expect(metrics.periodEnd).toBeInstanceOf(Date);
        // startDate por defecto = hace ~365 días; endDate por defecto = ahora.
        expect(metrics.periodStart.getTime()).toBeLessThan(
            metrics.periodEnd.getTime(),
        );
    });
});
