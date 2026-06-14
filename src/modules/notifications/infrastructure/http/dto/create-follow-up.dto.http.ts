import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDate,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Min,
    ValidateNested,
} from 'class-validator';

export class HttpFollowUpInternalDto {
    @ApiProperty({ example: '2026-06-10T14:00:00.000Z' })
    @Type(() => Date)
    @IsDate()
    fechaEnvio!: Date;

    @ApiProperty({
        example: 1,
        required: false,
        nullable: true,
        description: 'ID de la plantilla del correo interno (opcional)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idTemplate: number | null = null;

    @ApiProperty({ example: 'Revisión de actividad' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    asunto!: string;

    @ApiProperty({ example: '<p>Por favor revisa la actividad...</p>' })
    @IsString()
    @IsNotEmpty()
    cuerpo!: string;
}

export class HttpFollowUpExternalDto {
    @ApiProperty({
        example: 'cliente@empresa.com',
        description: 'Correo del contacto asociado al lead',
    })
    @IsEmail()
    correoCliente!: string;

    @ApiProperty({
        example: '2026-06-10T16:00:00.000Z',
        description: 'Debe ser posterior al envío del correo interno',
    })
    @Type(() => Date)
    @IsDate()
    fechaEnvio!: Date;

    @ApiProperty({
        example: 2,
        required: false,
        nullable: true,
        description: 'ID de la plantilla del correo externo (opcional)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idTemplate: number | null = null;

    @ApiProperty({ example: 'Seguimiento de su propuesta' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    asunto!: string;

    @ApiProperty({ example: '<p>Estimado cliente...</p>' })
    @IsString()
    @IsNotEmpty()
    cuerpo!: string;
}

export class HttpCreateFollowUpDto {
    @ApiProperty({
        example: 1,
        description:
            'ID del lead. La actividad activa (única) se resuelve en el servidor',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idLead!: number;

    @ApiProperty({ type: HttpFollowUpInternalDto })
    @ValidateNested()
    @Type(() => HttpFollowUpInternalDto)
    internal!: HttpFollowUpInternalDto;

    @ApiProperty({ type: HttpFollowUpExternalDto })
    @ValidateNested()
    @Type(() => HttpFollowUpExternalDto)
    external!: HttpFollowUpExternalDto;
}
