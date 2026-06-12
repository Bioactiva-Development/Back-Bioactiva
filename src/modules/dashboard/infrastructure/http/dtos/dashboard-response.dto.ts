import { ApiProperty } from '@nestjs/swagger';
import type { DashboardMetrics } from '@/modules/dashboard/domain/ports/dashboard-repository.port';

export class DashboardResponseDto {
    @ApiProperty({ description: 'Total de leads en el período' })
    totalLeads: number;

    @ApiProperty({ description: 'Valor promedio del ticket (cotizaciones cerradas con venta)' })
    averageTicketAmount: number;

    @ApiProperty({ description: 'Tasa de conversión general (%)' })
    conversionRate: number;

    @ApiProperty({ description: 'Tiempo promedio de cierre (días)' })
    avgClosingTimeDays: number;

    @ApiProperty({ description: '% de propuestas que terminan en cierre con venta' })
    proposalToCloseRate: number;

    @ApiProperty({ description: 'Tiempo promedio en etapa de propuesta (días)' })
    avgProposalStageDays: number;

    @ApiProperty({ description: 'Promedio de actividades por lead' })
    avgActivitiesPerLead: number;

    @ApiProperty({ description: 'Monto total del pipeline (leads abiertos)' })
    pipelineTotalAmount: number;

    @ApiProperty({ description: 'Ingresos totales cerrados' })
    closedRevenue: number;

    @ApiProperty({ description: '% de leads estancados (>30d sin cambio de estado)' })
    stalledLeadPercentage: number;

    @ApiProperty({ description: 'Inicio del período analizado' })
    periodStart: Date;

    @ApiProperty({ description: 'Fin del período analizado' })
    periodEnd: Date;

    constructor(metrics: DashboardMetrics) {
        this.totalLeads = metrics.totalLeads;
        this.averageTicketAmount = metrics.averageTicketAmount;
        this.conversionRate = metrics.conversionRate;
        this.avgClosingTimeDays = metrics.avgClosingTimeDays;
        this.proposalToCloseRate = metrics.proposalToCloseRate;
        this.avgProposalStageDays = metrics.avgProposalStageDays;
        this.avgActivitiesPerLead = metrics.avgActivitiesPerLead;
        this.pipelineTotalAmount = metrics.pipelineTotalAmount;
        this.closedRevenue = metrics.closedRevenue;
        this.stalledLeadPercentage = metrics.stalledLeadPercentage;
        this.periodStart = metrics.periodStart;
        this.periodEnd = metrics.periodEnd;
    }
}
