import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { GetDashboardMetricsUseCase } from '@/modules/dashboard/application/use-cases/get-dashboard-metrics.use-case';
import { DashboardQueryDto } from '@/modules/dashboard/infrastructure/http/dtos/dashboard-query.dto';
import { DashboardResponseDto } from '@/modules/dashboard/infrastructure/http/dtos/dashboard-response.dto';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
import {
    startOfDayInZone,
    endOfDayInZone,
} from '@/shared/infrastructure/datetime/range-in-zone';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
        private readonly appTime: AppTimeConfig,
    ) {}

    @Get('metrics')
    @ApiOperation({
        summary: 'Obtener las métricas del dashboard',
        description:
            'Calcula KPIs de leads y cotizaciones (conversión, pipeline, ingresos, etc.) para el rango de fechas indicado. Sin startDate/endDate, ambos son opcionales; con idEncargado filtra por responsable.',
    })
    @ApiResponse({
        status: 200,
        description: 'Métricas calculadas para el período solicitado',
        type: DashboardResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async getMetrics(
        @Query() query: DashboardQueryDto,
    ): Promise<DashboardResponseDto> {
        const metrics = await this.getDashboardMetricsUseCase.execute({
            startDate: query.startDate
                ? startOfDayInZone(query.startDate, this.appTime.timeZone)
                : undefined,
            endDate: query.endDate
                ? endOfDayInZone(query.endDate, this.appTime.timeZone)
                : undefined,
            idEncargado: query.idEncargado,
        });
        return new DashboardResponseDto(metrics);
    }
}
