import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class DashboardQueryDto {
    @ApiPropertyOptional({ description: 'Fecha inicio (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha fin (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Filtrar por responsable' })
    @IsInt()
    @Min(1)
    @IsOptional()
    idEncargado?: number;
}
