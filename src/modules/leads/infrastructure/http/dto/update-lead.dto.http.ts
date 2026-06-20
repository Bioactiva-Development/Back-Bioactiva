import { IsOptional, IsString, IsInt, Length, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class HttpUpdateLeadDto {
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
