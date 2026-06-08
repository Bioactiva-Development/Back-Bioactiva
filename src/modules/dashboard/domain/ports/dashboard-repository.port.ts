export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');

export interface DashboardMetrics {
    totalLeads: number;
    averageTicketAmount: number;
    conversionRate: number;
    avgClosingTimeDays: number;
    proposalToCloseRate: number;
    avgProposalStageDays: number;
    avgActivitiesPerLead: number;
    pipelineTotalAmount: number;
    closedRevenue: number;
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
