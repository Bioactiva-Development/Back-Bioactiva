import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';

export class ListActivitiesQueryDto {
    @ApiPropertyOptional({ description: 'Filtrar por ID del lead', example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idLead?: number;

    @ApiPropertyOptional({
        description: 'Filtrar por ID del responsable',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idResponsable?: number;

    @ApiPropertyOptional({
        enum: EstadoActividad,
        description: 'Filtrar por estado',
        example: 'PENDIENTE',
    })
    @IsOptional()
    @IsEnum(EstadoActividad)
    estado?: EstadoActividad;

    @ApiPropertyOptional({
        enum: TipoActividad,
        description: 'Filtrar por tipo',
        example: 'LLAMADA',
    })
    @IsOptional()
    @IsEnum(TipoActividad)
    tipo?: TipoActividad;

    @ApiPropertyOptional({
        description: 'Filtrar por fecha de inicio mínima',
        example: '2026-06-01T00:00:00.000Z',
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fechaInicio?: Date;

    @ApiPropertyOptional({
        description: 'Filtrar por fecha de inicio máxima',
        example: '2026-06-30T23:59:59.000Z',
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fechaFin?: Date;

    @ApiPropertyOptional({
        description: 'Número de página',
        default: 1,
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Elementos por página',
        default: 10,
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
