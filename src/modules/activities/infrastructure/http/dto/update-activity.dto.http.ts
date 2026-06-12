import {
    IsDate,
    IsInt,
    IsOptional,
    IsString,
    Length,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class HttpUpdateActivityDto {
    @ApiPropertyOptional({
        example: 'Llamada de seguimiento',
        description: 'Nombre de la actividad',
    })
    @IsOptional()
    @IsString()
    @Length(1, 90)
    nombreActividad?: string;

    @ApiPropertyOptional({
        example: '2026-06-01T10:00:00.000Z',
        description: 'Fecha y hora de inicio',
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fechaInicio?: Date;

    @ApiPropertyOptional({
        example: '2026-06-01T11:00:00.000Z',
        description: 'Fecha y hora de fin',
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fechaFin?: Date;

    @ApiPropertyOptional({
        example: 'Confirmar detalles del proyecto',
        description: 'Notas de la actividad',
    })
    @IsOptional()
    @IsString()
    @Length(1, 1000)
    notas?: string | null;

    @ApiPropertyOptional({
        example: 1,
        description: 'ID del usuario responsable',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idResponsable?: number;
}
