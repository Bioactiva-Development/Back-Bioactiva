import {
    IsDate,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';

export class HttpCreateActivityDto {
    @ApiProperty({ example: 1, description: 'ID del lead asociado' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idLead!: number;

    @ApiProperty({
        example: 'Llamada de seguimiento',
        description: 'Nombre de la actividad',
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 90)
    nombreActividad!: string;

    @ApiProperty({
        example: '2026-06-01T10:00:00.000Z',
        description: 'Fecha y hora de inicio',
    })
    @Type(() => Date)
    @IsDate()
    fechaInicio!: Date;

    @ApiProperty({
        example: '2026-06-01T11:00:00.000Z',
        description: 'Fecha y hora de fin (debe ser mayor que la de inicio)',
    })
    @Type(() => Date)
    @IsDate()
    fechaFin!: Date;

    @ApiProperty({
        enum: TipoActividad,
        example: TipoActividad.LLAMADA,
        description: 'Tipo de actividad',
    })
    @IsEnum(TipoActividad)
    tipo!: TipoActividad;

    @ApiPropertyOptional({
        example: 'Confirmar detalles del proyecto',
        description: 'Notas de la actividad',
    })
    @IsOptional()
    @IsString()
    @Length(1, 1000)
    notas?: string | null;

    /**
     * @deprecated El responsable ya no se elige: la actividad se asigna siempre
     * al encargado del lead. El campo se acepta por compatibilidad pero se ignora.
     */
    @ApiPropertyOptional({
        deprecated: true,
        description:
            'Obsoleto. El responsable es siempre el encargado del lead; este valor se ignora.',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idResponsable?: number;
}
