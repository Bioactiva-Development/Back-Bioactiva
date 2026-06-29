import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
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
        enum: Sector,
        description: 'Filtrar por sector de la organización del lead',
        example: 'TECNOLOGIA',
    })
    @IsOptional()
    @IsEnum(Sector)
    sector?: Sector;

    @ApiPropertyOptional({
        enum: EnterpriseType,
        description: 'Filtrar por tipo de organización del lead',
        example: 'EMPRESA_NACIONAL',
    })
    @IsOptional()
    @IsEnum(EnterpriseType)
    tipo?: EnterpriseType;

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
            'Filtra leads por el nivel del semáforo de actividades: SIN_ACTIVIDADES (sin pendientes), PENDIENTE (ninguna urgente) o POR_VENCER (alguna vence en ≤2 días o ya vencida). Si se omite, no filtra.',
        example: ActivityAlertLevel.POR_VENCER,
    })
    @IsOptional()
    @IsEnum(ActivityAlertLevel)
    alertaActividad?: ActivityAlertLevel;

    @ApiPropertyOptional({
        description:
            'Si es true, devuelve solo los leads cuyo encargado es el usuario autenticado.',
        example: true,
    })
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    misLeads?: boolean;

    @ApiPropertyOptional({
        description:
            'Si es true, devuelve solo los leads que tienen al menos una actividad pendiente.',
        example: true,
    })
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    conActividadesPendientes?: boolean;

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
