import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
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

export class HttpFollowUpEmailDto {
    @ApiProperty({ example: '2026-06-10T14:00:00.000Z' })
    @Type(() => Date)
    @IsDate()
    fechaEnvio!: Date;

    @ApiProperty({
        example: 1,
        required: false,
        nullable: true,
        description: 'ID de la plantilla del correo (opcional)',
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

    @ApiProperty({ example: '<p>Contenido del correo...</p>' })
    @IsString()
    @IsNotEmpty()
    cuerpo!: string;
}

export class HttpFollowUpInstanceDto {
    @ApiProperty({
        type: HttpFollowUpEmailDto,
        description: 'Correo interno al responsable de la actividad',
    })
    @ValidateNested()
    @Type(() => HttpFollowUpEmailDto)
    internal!: HttpFollowUpEmailDto;

    @ApiProperty({
        type: HttpFollowUpEmailDto,
        description: 'Correo externo al cliente (posterior al interno)',
    })
    @ValidateNested()
    @Type(() => HttpFollowUpEmailDto)
    external!: HttpFollowUpEmailDto;
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

    @ApiProperty({
        example: 'cliente@empresa.com',
        description:
            'Correo del contacto del lead; el mismo para todas las instancias',
    })
    @IsEmail()
    correoCliente!: string;

    @ApiProperty({
        type: [HttpFollowUpInstanceDto],
        description: 'Una única instancia de seguimiento',
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(1)
    @ValidateNested({ each: true })
    @Type(() => HttpFollowUpInstanceDto)
    instancias!: HttpFollowUpInstanceDto[];
}
