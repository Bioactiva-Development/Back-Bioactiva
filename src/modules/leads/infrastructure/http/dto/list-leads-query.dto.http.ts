import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { IsAfterOrEqualDate } from '@/shared/infrastructure/validators/is-after-or-equal-date.validator';

export class ListLeadsQueryDto {
    @ApiPropertyOptional({
        enum: LeadState,
        description: 'Filtrar por estado',
        example: 'EN_PROSPECTO',
    })
    @IsOptional()
    @IsEnum(LeadState)
    estado?: LeadState;

    @ApiPropertyOptional({
        description: 'Filtrar por ID de organización',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    idOrg?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por ID del encargado',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idEncargado?: number;

    @ApiPropertyOptional({
        description: 'Búsqueda textual en servicio de interés',
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    search?: string;

    @ApiPropertyOptional({
        description:
            'Búsqueda por nombre (o nombre comercial) de la organización del lead',
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    term?: string;

    @ApiPropertyOptional({
        enum: Sector,
        description: 'Filtrar por sector de la organización del lead',
        example: 'TECNOLOGIA',
    })
    @IsOptional()
    @IsEnum(Sector)
    sector?: Sector;

    @ApiPropertyOptional({
        description: 'Filtrar por fecha de creación desde (ISO 8601)',
    })
    @IsOptional()
    @IsDateString()
    fechaDesde?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por fecha de creación hasta (ISO 8601)',
    })
    @IsOptional()
    @IsDateString()
    @IsAfterOrEqualDate('fechaDesde')
    fechaHasta?: string;

    @ApiPropertyOptional({
        enum: ActivityAlertLevel,
        description:
            'Filtra leads por el nivel del semáforo de actividades: LIBRE (sin pendientes), PENDIENTE, CRITICO (pasó la mitad del tiempo) o POR_VENCER (vence en ≤4 días o vencida). Si se omite, no filtra.',
        example: ActivityAlertLevel.POR_VENCER,
    })
    @IsOptional()
    @IsEnum(ActivityAlertLevel)
    alertaActividad?: ActivityAlertLevel;

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
