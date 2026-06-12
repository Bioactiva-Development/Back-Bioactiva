import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';

export class HttpUpdateEmailTemplateDto {
    @ApiPropertyOptional({ example: 'Recordatorio estándar' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    nombre?: string;

    @ApiPropertyOptional({ example: 'Recordatorio: actividad pendiente' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    asunto?: string;

    @ApiPropertyOptional({ example: '<p>Cuerpo actualizado...</p>' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    cuerpo?: string;

    @ApiPropertyOptional({
        example: false,
        description: 'Activa/desactiva la plantilla',
    })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
