import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { IsAfterOrEqualDate } from '@/shared/infrastructure/validators/is-after-or-equal-date.validator';

export class KpisCotizacionesQueryDto {
    @ApiPropertyOptional({ description: 'Fecha desde (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    fechaDesde?: string;

    @ApiPropertyOptional({ description: 'Fecha hasta (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    @IsAfterOrEqualDate('fechaDesde')
    fechaHasta?: string;
}
