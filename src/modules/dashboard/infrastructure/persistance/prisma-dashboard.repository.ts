import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    type DashboardMetrics,
    type DashboardRepositoryPort,
    type DistItem,
    type MetricsQuery,
    type MoneyByCurrency,
} from '@/modules/dashboard/domain/ports/dashboard-repository.port';

const CIERRE_CON_VENTA = 'CIERRE_CON_VENTA';
const CIERRE_SIN_VENTA = 'CIERRE_SIN_VENTA';
const OFERTADO = 'OFERTADO';

const STALLED_DAYS = 30;

@Injectable()
export class PrismaDashboardRepository implements DashboardRepositoryPort {
    private readonly logger = new Logger(PrismaDashboardRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    async getMetrics(query: MetricsQuery): Promise<DashboardMetrics> {
        const startDate =
            query.startDate ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const endDate = query.endDate ?? new Date();
        const idEncargado = query.idEncargado;
        const stalledCutoff = new Date(
            Date.now() - STALLED_DAYS * 24 * 60 * 60 * 1000,
        );

        // Tres consultas en total (antes hasta 13). Cada una usa una sola
        // conexión del pool, así que el endpoint más pesado deja de provocar
        // ráfagas de conexiones contra la base de datos compartida.
        const [leadAgg, quotationAgg, activityCount] = await Promise.all([
            this.getLeadAggregates(startDate, endDate, idEncargado, stalledCutoff),
            this.getQuotationAggregates(startDate, endDate, idEncargado),
            this.getActivityCount(startDate, endDate, idEncargado),
        ]);

        const totalLeads = leadAgg.totalLeads;
        const closedCount = leadAgg.closedCount;
        const closedPlusLost = leadAgg.closedCount + leadAgg.lostCount;

        return {
            totalLeads,
            averageTicketAmount: quotationAgg.averageTicket,
            conversionRate:
                totalLeads > 0 ? (closedCount / totalLeads) * 100 : 0,
            avgClosingTimeDays: leadAgg.avgClosingDays,
            proposalToCloseRate:
                closedPlusLost > 0 ? (closedCount / closedPlusLost) * 100 : 0,
            avgProposalStageDays: leadAgg.avgProposalDays,
            avgActivitiesPerLead:
                totalLeads > 0 ? activityCount / totalLeads : 0,
            pipelineTotalAmount: quotationAgg.pipelineTotal,
            closedRevenue: quotationAgg.closedTotal,
            stalledLeadPercentage:
                totalLeads > 0
                    ? (leadAgg.stalledCount / totalLeads) * 100
                    : 0,
            periodStart: startDate,
            periodEnd: endDate,
            distribucionPipeline: leadAgg.distribucionPipeline,
            distribucionCotizaciones: quotationAgg.distribucionCotizaciones,
        };
    }

    /**
     * Agrega en una sola pasada sobre "Lead" todas las métricas derivadas de los
     * leads: totales, conversión, tiempos promedio y leads estancados. Sustituye
     * a countTotalLeads + getConversionData + getAvgClosingTime +
     * getAvgProposalStageTime + getStalledLeads (antes 5 métodos / 7 consultas).
     */
    private async getLeadAggregates(
        startDate: Date,
        endDate: Date,
        idEncargado: number | undefined,
        stalledCutoff: Date,
    ): Promise<{
        totalLeads: number;
        closedCount: number;
        lostCount: number;
        avgClosingDays: number;
        avgProposalDays: number;
        stalledCount: number;
        distribucionPipeline: DistItem[];
    }> {
        const params: unknown[] = [
            CIERRE_CON_VENTA,
            CIERRE_SIN_VENTA,
            OFERTADO,
            startDate,
            endDate,
            stalledCutoff,
        ];
        const encargadoClause = idEncargado
            ? ` AND l."idEncargado" = $${params.push(idEncargado)}`
            : '';

        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `
            SELECT
                COUNT(*) AS total_leads,
                COUNT(*) FILTER (WHERE l.estado = $1) AS closed_count,
                COUNT(*) FILTER (WHERE l.estado = $2) AS lost_count,
                AVG(EXTRACT(DAY FROM (l."fechaCierre" - l."createdAt")))
                    FILTER (
                        WHERE l.estado = $1 AND l."fechaCierre" IS NOT NULL
                    ) AS avg_closing_days,
                AVG(EXTRACT(DAY FROM (NOW() - l."ultimoCambioEstado")))
                    FILTER (WHERE l.estado = $3) AS avg_proposal_days,
                COUNT(*) FILTER (
                    WHERE l."ultimoCambioEstado" < $6
                      AND l.estado NOT IN ($1, $2)
                ) AS stalled_count,
                COUNT(*) FILTER (WHERE l.estado = 'EN_PROSPECTO')      AS dist_prospecto,
                COUNT(*) FILTER (WHERE l.estado = 'OFERTADO')          AS dist_ofertado,
                COUNT(*) FILTER (WHERE l.estado = 'CIERRE_CON_VENTA')  AS dist_cierre_venta,
                COUNT(*) FILTER (WHERE l.estado = 'CIERRE_SIN_VENTA')  AS dist_cierre_sin_venta
            FROM "Lead" l
            INNER JOIN "Organizacion" o ON o.id = l."idOrg"
            WHERE l."deletedAt" IS NULL
              AND o."deletedAt" IS NULL
              AND l."createdAt" >= $4
              AND l."createdAt" <= $5
              ${encargadoClause}
        `,
            ...params,
        );

        const row = rows[0] ?? {};
        return {
            totalLeads: Number(row.total_leads ?? 0),
            closedCount: Number(row.closed_count ?? 0),
            lostCount: Number(row.lost_count ?? 0),
            avgClosingDays: Number(row.avg_closing_days ?? 0),
            avgProposalDays: Number(row.avg_proposal_days ?? 0),
            stalledCount: Number(row.stalled_count ?? 0),
            distribucionPipeline: [
                { estado: 'EN_PROSPECTO',    cantidad: Number(row.dist_prospecto ?? 0) },
                { estado: 'OFERTADO',        cantidad: Number(row.dist_ofertado ?? 0) },
                { estado: 'CIERRE_CON_VENTA', cantidad: Number(row.dist_cierre_venta ?? 0) },
                { estado: 'CIERRE_SIN_VENTA', cantidad: Number(row.dist_cierre_sin_venta ?? 0) },
            ],
        };
    }

    /**
     * Agrega en una sola consulta sobre "Cotizacion" ⋈ "Lead" el monto en
     * pipeline, el ingreso cerrado y el ticket promedio. Sustituye a
     * getPipelineAmount + getClosedRevenue (antes 2 métodos / hasta 4 consultas).
     *
     * Nota: pipeline filtra por la fecha de creación del lead; el ingreso cerrado
     * filtra por la fecha de creación de la cotización. Por eso ambos predicados
     * de fecha viven dentro del FILTER de cada métrica, no en el WHERE común.
     */
    private async getQuotationAggregates(
        startDate: Date,
        endDate: Date,
        idEncargado: number | undefined,
    ): Promise<{
        pipelineTotal: MoneyByCurrency;
        closedTotal: MoneyByCurrency;
        averageTicket: MoneyByCurrency;
        distribucionCotizaciones: DistItem[];
    }> {
        const params: unknown[] = [
            CIERRE_CON_VENTA,
            CIERRE_SIN_VENTA,
            startDate,
            endDate,
        ];
        const encargadoClause = idEncargado
            ? ` AND l."idEncargado" = $${params.push(idEncargado)}`
            : '';

        // Cada métrica se desdobla por moneda (c.tipo): PEN y USD nunca se
        // suman entre sí porque representan divisas distintas.
        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `
            SELECT
                COALESCE(SUM(c.monto) FILTER (
                    WHERE l.estado NOT IN ($1, $2)
                      AND l."createdAt" >= $3
                      AND l."createdAt" <= $4
                      AND c.tipo = 'PEN'
                ), 0) AS pipeline_pen,
                COALESCE(SUM(c.monto) FILTER (
                    WHERE l.estado NOT IN ($1, $2)
                      AND l."createdAt" >= $3
                      AND l."createdAt" <= $4
                      AND c.tipo = 'USD'
                ), 0) AS pipeline_usd,
                COALESCE(SUM(c.monto) FILTER (
                    WHERE l.estado = $1
                      AND c."createdAt" >= $3
                      AND c."createdAt" <= $4
                      AND c.tipo = 'PEN'
                ), 0) AS closed_pen,
                COALESCE(SUM(c.monto) FILTER (
                    WHERE l.estado = $1
                      AND c."createdAt" >= $3
                      AND c."createdAt" <= $4
                      AND c.tipo = 'USD'
                ), 0) AS closed_usd,
                COALESCE(AVG(c.monto) FILTER (
                    WHERE l.estado = $1
                      AND c."createdAt" >= $3
                      AND c."createdAt" <= $4
                      AND c.tipo = 'PEN'
                ), 0) AS ticket_pen,
                COALESCE(AVG(c.monto) FILTER (
                    WHERE l.estado = $1
                      AND c."createdAt" >= $3
                      AND c."createdAt" <= $4
                      AND c.tipo = 'USD'
                ), 0) AS ticket_usd,
                COUNT(*) FILTER (
                    WHERE c.estado = 'PENDIENTE'
                      AND c."createdAt" >= $3 AND c."createdAt" <= $4
                ) AS dist_cot_pendiente,
                COUNT(*) FILTER (
                    WHERE c.estado = 'ENVIADA'
                      AND c."createdAt" >= $3 AND c."createdAt" <= $4
                ) AS dist_cot_enviada,
                COUNT(*) FILTER (
                    WHERE c.estado = 'ACEPTADA'
                      AND c."createdAt" >= $3 AND c."createdAt" <= $4
                ) AS dist_cot_aceptada,
                COUNT(*) FILTER (
                    WHERE c.estado = 'RECHAZADA'
                      AND c."createdAt" >= $3 AND c."createdAt" <= $4
                ) AS dist_cot_rechazada
            FROM "Cotizacion" c
            INNER JOIN "Lead" l ON l.id = c."idLead"
            INNER JOIN "Organizacion" o ON o.id = l."idOrg"
            WHERE l."deletedAt" IS NULL
              AND o."deletedAt" IS NULL
              AND c."deletedAt" IS NULL
              ${encargadoClause}
        `,
            ...params,
        );

        const row = rows[0] ?? {};
        return {
            pipelineTotal: {
                pen: Number(row.pipeline_pen ?? 0),
                usd: Number(row.pipeline_usd ?? 0),
            },
            closedTotal: {
                pen: Number(row.closed_pen ?? 0),
                usd: Number(row.closed_usd ?? 0),
            },
            averageTicket: {
                pen: Number(row.ticket_pen ?? 0),
                usd: Number(row.ticket_usd ?? 0),
            },
            distribucionCotizaciones: [
                { estado: 'PENDIENTE',  cantidad: Number(row.dist_cot_pendiente ?? 0) },
                { estado: 'ENVIADA',    cantidad: Number(row.dist_cot_enviada ?? 0) },
                { estado: 'ACEPTADA',   cantidad: Number(row.dist_cot_aceptada ?? 0) },
                { estado: 'RECHAZADA',  cantidad: Number(row.dist_cot_rechazada ?? 0) },
            ],
        };
    }

    /**
     * Cuenta las actividades del periodo (no soft-deleted) cuyos leads caen en el
     * rango y, opcionalmente, pertenecen al encargado.
     */
    private async getActivityCount(
        startDate: Date,
        endDate: Date,
        idEncargado: number | undefined,
    ): Promise<number> {
        const leadFilter: {
            createdAt: { gte: Date; lte: Date };
            deletedAt: null;
            organizacion: { deletedAt: null };
            idEncargado?: number;
        } = {
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null,
            // No contar actividades de leads cuya organización fue eliminada.
            organizacion: { deletedAt: null },
        };
        if (idEncargado) {
            leadFilter.idEncargado = idEncargado;
        }

        return this.prisma.actividad.count({
            where: { deletedAt: null, lead: leadFilter },
        });
    }
}
