import {
    IsOptional,
    IsString,
    IsInt,
    Length,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class HttpUpdateLeadDto {
    @ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'UUID de la organización',
    })
    @IsOptional()
    @IsString()
    idOrg?: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'ID del contacto asociado (opcional)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idContacto?: number | null;

    @ApiPropertyOptional({
        example: 'Consultoría en transformación digital',
        description: 'Servicio de interés del lead',
    })
    @IsOptional()
    @IsString()
    @Length(1, 120)
    servicioInteres?: string;

    @ApiPropertyOptional({
        example: 'Cliente interesado en paquete completo',
        description: 'Comentarios adicionales',
    })
    @IsOptional()
    @IsString()
    @Length(1, 500)
    comentarios?: string | null;

    @ApiPropertyOptional({
        example: 'Necesita optimizar procesos internos',
        description: 'Desafío u oportunidad identificada',
    })
    @IsOptional()
    @IsString()
    @Length(1, 500)
    desafioOportunidad?: string | null;

    @ApiPropertyOptional({
        example: 'Llamada inicial realizada, cliente muy interesado',
        description: 'Notas de contacto',
    })
    @IsOptional()
    @IsString()
    @Length(1, 1000)
    notasContacto?: string | null;

    @ApiPropertyOptional({
        example: 'LinkedIn',
        description: 'Canal de captación del lead',
    })
    @IsOptional()
    @IsString()
    @Length(1, 60)
    canalCaptacion?: string | null;

    @ApiPropertyOptional({
        example: 1,
        description: 'ID del usuario encargado del lead',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idEncargado?: number;
}
