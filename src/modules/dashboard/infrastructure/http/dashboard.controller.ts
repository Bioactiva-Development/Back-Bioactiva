import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { GetDashboardMetricsUseCase } from '@/modules/dashboard/application/use-cases/get-dashboard-metrics.use-case';
import { DashboardQueryDto } from '@/modules/dashboard/infrastructure/http/dtos/dashboard-query.dto';
import { DashboardResponseDto } from '@/modules/dashboard/infrastructure/http/dtos/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    ) {}

    @Get('metrics')
    async getMetrics(
        @Query() query: DashboardQueryDto,
    ): Promise<DashboardResponseDto> {
        const metrics = await this.getDashboardMetricsUseCase.execute({
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            idEncargado: query.idEncargado,
        });
        return new DashboardResponseDto(metrics);
    }
}
