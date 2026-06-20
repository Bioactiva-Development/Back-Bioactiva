import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Min,
} from 'class-validator';

export class HttpCreateReminderDto {
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
        example: 15,
        minimum: 1,
        description:
            'Minutos antes de que finalice la actividad en que el encargado recibe el recordatorio (mínimo 1; el envío resultante debe ser futuro).',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    minutosAntes!: number;

    @ApiProperty({
        example: 1,
        required: false,
        nullable: true,
        description:
            'ID de la plantilla de correo (opcional). Si se omite, se usa el asunto/cuerpo enviado',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idTemplate: number | null = null;

    @ApiProperty({
        example: 'Recordatorio: actividad pendiente',
        description:
            'Asunto del correo interno (copia editable de la plantilla)',
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    asunto!: string;

    @ApiProperty({
        example: '<p>Recuerda revisar la actividad...</p>',
        description:
            'Cuerpo del correo interno (copia editable de la plantilla)',
    })
    @IsString()
    @IsNotEmpty()
    cuerpo!: string;
}
