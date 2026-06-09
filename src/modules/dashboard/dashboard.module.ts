import { Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { DashboardController } from '@/modules/dashboard/infrastructure/http/dashboard.controller';
import { PrismaDashboardRepository } from '@/modules/dashboard/infrastructure/persistance/prisma-dashboard.repository';
import { DASHBOARD_REPOSITORY } from '@/modules/dashboard/domain/ports/dashboard-repository.port';
import { GetDashboardMetricsUseCase } from '@/modules/dashboard/application/use-cases/get-dashboard-metrics.use-case';

@Module({
    imports: [PrismaModule],
    controllers: [DashboardController],
    providers: [
        PrismaDashboardRepository,
        {
            provide: DASHBOARD_REPOSITORY,
            useExisting: PrismaDashboardRepository,
        },
        GetDashboardMetricsUseCase,
    ],
})
export class DashboardModule {}
