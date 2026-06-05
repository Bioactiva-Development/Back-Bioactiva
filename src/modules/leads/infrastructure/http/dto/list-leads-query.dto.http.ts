import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

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
