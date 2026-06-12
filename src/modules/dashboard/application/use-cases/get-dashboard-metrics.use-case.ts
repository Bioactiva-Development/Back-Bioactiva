import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    DASHBOARD_REPOSITORY,
    type DashboardRepositoryPort,
    type DashboardMetrics,
    type MetricsQuery,
} from '@/modules/dashboard/domain/ports/dashboard-repository.port';

export class GetDashboardMetricsUseCase {
    constructor(
        @Inject(DASHBOARD_REPOSITORY)
        private readonly dashboardRepository: DashboardRepositoryPort,
    ) {}

    async execute(query: MetricsQuery): Promise<DashboardMetrics> {
        return this.dashboardRepository.getMetrics(query);
    }
}
