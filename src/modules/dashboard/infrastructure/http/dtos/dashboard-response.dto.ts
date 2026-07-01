import { ApiProperty } from '@nestjs/swagger';
import type {
    DashboardMetrics,
    DistItem,
    MoneyByCurrency,
} from '@/modules/dashboard/domain/ports/dashboard-repository.port';

export class DistItemDto implements DistItem {
    @ApiProperty({ example: 'EN_PROSPECTO' })
    estado: string;

    @ApiProperty({ example: 12 })
    cantidad: number;
}

/** Forma Swagger de un monto separado por moneda. */
export class MoneyByCurrencyDto {
    @ApiProperty({ description: 'Monto en soles (PEN)' })
    pen: number;

    @ApiProperty({ description: 'Monto en dólares (USD)' })
    usd: number;
}

export class DashboardResponseDto {
    @ApiProperty({ description: 'Total de leads en el período' })
    totalLeads: number;

    @ApiProperty({
        type: MoneyByCurrencyDto,
        description:
            'Valor promedio del ticket (cotizaciones cerradas con venta), separado por moneda',
    })
    averageTicketAmount: MoneyByCurrency;

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

    @ApiProperty({
        type: MoneyByCurrencyDto,
        description: 'Monto total del pipeline (leads abiertos), separado por moneda',
    })
    pipelineTotalAmount: MoneyByCurrency;

    @ApiProperty({
        type: MoneyByCurrencyDto,
        description: 'Ingresos totales cerrados, separado por moneda',
    })
    closedRevenue: MoneyByCurrency;

    @ApiProperty({ description: '% de leads estancados (>30d sin cambio de estado)' })
    stalledLeadPercentage: number;

    @ApiProperty({ description: 'Inicio del período analizado' })
    periodStart: Date;

    @ApiProperty({ description: 'Fin del período analizado' })
    periodEnd: Date;

    @ApiProperty({
        type: [DistItemDto],
        description:
            'Conteo de leads por estado en el período (EN_PROSPECTO, OFERTADO, CIERRE_CON_VENTA, CIERRE_SIN_VENTA)',
    })
    distribucionPipeline: DistItem[];

    @ApiProperty({
        type: [DistItemDto],
        description:
            'Conteo de cotizaciones por estado en el período (PENDIENTE, ENVIADA, ACEPTADA, RECHAZADA)',
    })
    distribucionCotizaciones: DistItem[];

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
        this.distribucionPipeline = metrics.distribucionPipeline;
        this.distribucionCotizaciones = metrics.distribucionCotizaciones;
    }
}
