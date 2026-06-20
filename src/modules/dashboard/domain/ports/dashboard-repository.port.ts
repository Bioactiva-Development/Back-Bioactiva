export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');

/**
 * Montos separados por moneda. Las cotizaciones pueden estar en soles (PEN) o
 * dólares (USD), así que nunca se suman entre sí: cada divisa se reporta aparte.
 */
export interface MoneyByCurrency {
    pen: number;
    usd: number;
}

export interface DashboardMetrics {
    totalLeads: number;
    averageTicketAmount: MoneyByCurrency;
    conversionRate: number;
    avgClosingTimeDays: number;
    proposalToCloseRate: number;
    avgProposalStageDays: number;
    avgActivitiesPerLead: number;
    pipelineTotalAmount: MoneyByCurrency;
    closedRevenue: MoneyByCurrency;
    stalledLeadPercentage: number;
    periodStart: Date;
    periodEnd: Date;
}

export interface MetricsQuery {
    startDate?: Date;
    endDate?: Date;
    idEncargado?: number;
}

export interface DashboardRepositoryPort {
    getMetrics(query: MetricsQuery): Promise<DashboardMetrics>;
}
