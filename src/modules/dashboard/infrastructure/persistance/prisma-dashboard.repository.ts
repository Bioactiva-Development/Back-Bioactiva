import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type DashboardMetrics,
    type DashboardRepositoryPort,
    type MetricsQuery,
} from '@/modules/dashboard/domain/ports/dashboard-repository.port';

const CIERRE_CON_VENTA = 'CIERRE_CON_VENTA';
const CIERRE_SIN_VENTA = 'CIERRE_SIN_VENTA';
const OFERTADO = 'OFERTADO';

@Injectable()
export class PrismaDashboardRepository implements DashboardRepositoryPort {
    private readonly logger = new Logger(PrismaDashboardRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    async getMetrics(query: MetricsQuery): Promise<DashboardMetrics> {
        const startDate =
            query.startDate ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const endDate = query.endDate ?? new Date();
        const encargadoFilter = query.idEncargado;

        const baseLeadFilter: any = {
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null,
        };
        if (encargadoFilter) {
            baseLeadFilter.idEncargado = encargadoFilter;
        }

        const baseActividadFilter: any = {
            deletedAt: null,
            lead: {
                createdAt: { gte: startDate, lte: endDate },
                deletedAt: null,
            },
        };
        if (encargadoFilter) {
            baseActividadFilter.lead = {
                ...baseActividadFilter.lead,
                idEncargado: encargadoFilter,
            };
        }

        const [
            totalLeads,
            conversionData,
            avgClosingRaw,
            proposalStageRaw,
            activityData,
            pipelineRaw,
            closedRaw,
            stalledData,
        ] = await Promise.all([
            this.countTotalLeads(baseLeadFilter),
            this.getConversionData(baseLeadFilter),
            this.getAvgClosingTime(baseLeadFilter),
            this.getAvgProposalStageTime(baseLeadFilter),
            this.getActivityData(baseActividadFilter),
            this.getPipelineAmount(baseLeadFilter),
            this.getClosedRevenue(baseLeadFilter, startDate, endDate),
            this.getStalledLeads(baseLeadFilter),
        ]);

        const totalLeadsCount = totalLeads || 1;
        const closedCount = conversionData.closedCount;
        const closedPlusLost =
            conversionData.closedCount + conversionData.lostCount;

        return {
            totalLeads,
            averageTicketAmount: closedRaw.averageTicket,
            conversionRate:
                totalLeads > 0 ? (closedCount / totalLeads) * 100 : 0,
            avgClosingTimeDays: avgClosingRaw,
            proposalToCloseRate:
                closedPlusLost > 0 ? (closedCount / closedPlusLost) * 100 : 0,
            avgProposalStageDays: proposalStageRaw,
            avgActivitiesPerLead:
                totalLeadsCount > 0 ? activityData / totalLeadsCount : 0,
            pipelineTotalAmount: pipelineRaw,
            closedRevenue: closedRaw.total,
            stalledLeadPercentage: stalledData,
            periodStart: startDate,
            periodEnd: endDate,
        };
    }

    private async countTotalLeads(baseFilter: any): Promise<number> {
        return this.prisma.lead.count({ where: baseFilter });
    }

    private async getConversionData(
        baseFilter: any,
    ): Promise<{ closedCount: number; lostCount: number }> {
        const groups = await this.prisma.lead.groupBy({
            by: ['estado'],
            where: baseFilter,
            _count: { id: true },
        });
        let closedCount = 0;
        let lostCount = 0;
        for (const g of groups) {
            if (g.estado === CIERRE_CON_VENTA) closedCount = g._count.id;
            if (g.estado === CIERRE_SIN_VENTA) lostCount = g._count.id;
        }
        return { closedCount, lostCount };
    }

    private async getAvgClosingTime(baseFilter: any): Promise<number> {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `
        SELECT AVG(EXTRACT(DAY FROM (l."updatedAt" - l."createdAt"))) AS avg_days
        FROM "Lead" l
        WHERE l.estado = $1
          AND l."deletedAt" IS NULL
          AND l."createdAt" >= $2
          AND l."createdAt" <= $3
    `,
            CIERRE_CON_VENTA,
            baseFilter.createdAt.gte,
            baseFilter.createdAt.lte,
        );

        if (baseFilter.idEncargado) {
            const rowsFiltered: any[] = await this.prisma.$queryRawUnsafe(
                `
            SELECT AVG(EXTRACT(DAY FROM (l."updatedAt" - l."createdAt"))) AS avg_days
            FROM "Lead" l
            WHERE l.estado = $1
              AND l."deletedAt" IS NULL
              AND l."createdAt" >= $2
              AND l."createdAt" <= $3
              AND l."idEncargado" = $4
        `,
                CIERRE_CON_VENTA,
                baseFilter.createdAt.gte,
                baseFilter.createdAt.lte,
                baseFilter.idEncargado,
            );

            return Number(rowsFiltered[0]?.avg_days ?? 0);
        }

        return Number(rows[0]?.avg_days ?? 0);
    }

    private async getAvgProposalStageTime(baseFilter: any): Promise<number> {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `
            SELECT AVG(EXTRACT(DAY FROM (NOW() - l."ultimoCambioEstado"))) AS avg_days
            FROM "Lead" l
            WHERE l.estado = $1
              AND l."deletedAt" IS NULL
              AND l."createdAt" >= $2
              AND l."createdAt" <= $3
        `,
            OFERTADO,
            baseFilter.createdAt.gte,
            baseFilter.createdAt.lte,
        );

        if (baseFilter.idEncargado) {
            const rowsFiltered: any[] = await this.prisma.$queryRawUnsafe(
                `
                SELECT AVG(EXTRACT(DAY FROM (NOW() - l."ultimoCambioEstado"))) AS avg_days
                FROM "Lead" l
                WHERE l.estado = $1
                  AND l."deletedAt" IS NULL
                  AND l."createdAt" >= $2
                  AND l."createdAt" <= $3
                  AND l."idEncargado" = $4
            `,
                OFERTADO,
                baseFilter.createdAt.gte,
                baseFilter.createdAt.lte,
                baseFilter.idEncargado,
            );
            return Number(rowsFiltered[0]?.avg_days ?? 0);
        }

        return Number(rows[0]?.avg_days ?? 0);
    }

    private async getActivityData(baseFilter: any): Promise<number> {
        return this.prisma.actividad.count({ where: baseFilter });
    }

    private async getPipelineAmount(baseFilter: any): Promise<number> {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `
            SELECT COALESCE(SUM(c.monto), 0) AS total
            FROM "Cotizacion" c
            INNER JOIN "Lead" l ON l.id = c."idLead"
            WHERE l.estado NOT IN ($1, $2)
              AND l."deletedAt" IS NULL
              AND c."deletedAt" IS NULL
              AND l."createdAt" >= $3
              AND l."createdAt" <= $4
        `,
            CIERRE_CON_VENTA,
            CIERRE_SIN_VENTA,
            baseFilter.createdAt.gte,
            baseFilter.createdAt.lte,
        );

        if (baseFilter.idEncargado) {
            const rowsFiltered: any[] = await this.prisma.$queryRawUnsafe(
                `
                SELECT COALESCE(SUM(c.monto), 0) AS total
                FROM "Cotizacion" c
                INNER JOIN "Lead" l ON l.id = c."idLead"
                WHERE l.estado NOT IN ($1, $2)
                  AND l."deletedAt" IS NULL
                  AND c."deletedAt" IS NULL
                  AND l."createdAt" >= $3
                  AND l."createdAt" <= $4
                  AND l."idEncargado" = $5
            `,
                CIERRE_CON_VENTA,
                CIERRE_SIN_VENTA,
                baseFilter.createdAt.gte,
                baseFilter.createdAt.lte,
                baseFilter.idEncargado,
            );
            return Number(rowsFiltered[0]?.total ?? 0);
        }

        return Number(rows[0]?.total ?? 0);
    }

    private async getClosedRevenue(
        baseFilter: any,
        startDate: Date,
        endDate: Date,
    ): Promise<{ total: number; averageTicket: number }> {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `
            SELECT
                COALESCE(SUM(c.monto), 0) AS total,
                COALESCE(AVG(c.monto), 0) AS avg_ticket
            FROM "Cotizacion" c
            INNER JOIN "Lead" l ON l.id = c."idLead"
            WHERE l.estado = $1
              AND l."deletedAt" IS NULL
              AND c."deletedAt" IS NULL
              AND c."createdAt" >= $2
              AND c."createdAt" <= $3
        `,
            CIERRE_CON_VENTA,
            startDate,
            endDate,
        );

        if (baseFilter.idEncargado) {
            const rowsFiltered: any[] = await this.prisma.$queryRawUnsafe(
                `
                SELECT
                    COALESCE(SUM(c.monto), 0) AS total,
                    COALESCE(AVG(c.monto), 0) AS avg_ticket
                FROM "Cotizacion" c
                INNER JOIN "Lead" l ON l.id = c."idLead"
                WHERE l.estado = $1
                  AND l."deletedAt" IS NULL
                  AND c."deletedAt" IS NULL
                  AND c."createdAt" >= $2
                  AND c."createdAt" <= $3
                  AND l."idEncargado" = $4
            `,
                CIERRE_CON_VENTA,
                startDate,
                endDate,
                baseFilter.idEncargado,
            );
            return {
                total: Number(rowsFiltered[0]?.total ?? 0),
                averageTicket: Number(rowsFiltered[0]?.avg_ticket ?? 0),
            };
        }

        return {
            total: Number(rows[0]?.total ?? 0),
            averageTicket: Number(rows[0]?.avg_ticket ?? 0),
        };
    }

    private async getStalledLeads(baseFilter: any): Promise<number> {
        const total = await this.prisma.lead.count({ where: baseFilter });
        if (total === 0) return 0;

        const stalledFilter = {
            ...baseFilter,
            ultimoCambioEstado: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
            estado: {
                notIn: [CIERRE_CON_VENTA as any, CIERRE_SIN_VENTA as any],
            },
        };

        const stalledCount = await this.prisma.lead.count({
            where: stalledFilter,
        });
        return (stalledCount / total) * 100;
    }
}
