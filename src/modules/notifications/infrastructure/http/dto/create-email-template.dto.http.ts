import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';

export class HttpCreateEmailTemplateDto {
    @ApiProperty({ example: 'Recordatorio estándar' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    nombre!: string;

    @ApiProperty({ example: 'Recordatorio: actividad pendiente' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    asunto!: string;

    @ApiProperty({ example: '<p>Hola, recuerda revisar la actividad...</p>' })
    @IsString()
    @IsNotEmpty()
    cuerpo!: string;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
