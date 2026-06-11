import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { IsAfterOrEqualDate } from '@/shared/infrastructure/validators/is-after-or-equal-date.validator';

export class ListCotizacionesQueryDto {
    @ApiPropertyOptional({ description: 'Filtrar por ID del lead' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idLead?: number;

    @ApiPropertyOptional({ enum: EstadoCot })
    @IsOptional()
    @IsEnum(EstadoCot)
    estado?: EstadoCot;

    @ApiPropertyOptional({ description: 'Filtrar por ID del remitente' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idRemitente?: number;

    @ApiPropertyOptional({ enum: TipoMoneda, description: 'Filtrar por moneda' })
    @IsOptional()
    @IsEnum(TipoMoneda)
    tipo?: TipoMoneda;

    @ApiPropertyOptional({ description: 'Fecha desde (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    fechaDesde?: string;

    @ApiPropertyOptional({ description: 'Fecha hasta (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    @IsAfterOrEqualDate('fechaDesde')
    fechaHasta?: string;

    @ApiPropertyOptional({ description: 'Número de página', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Elementos por página', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
