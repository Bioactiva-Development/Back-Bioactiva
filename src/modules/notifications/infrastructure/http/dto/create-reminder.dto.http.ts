import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDate,
    IsInt,
    IsNotEmpty,
    IsString,
    Length,
    Min,
} from 'class-validator';

export class HttpCreateReminderDto {
    @ApiProperty({ example: 1, description: 'ID de la actividad asociada' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idActividad!: number;

    @ApiProperty({
        example: '2026-06-10T14:00:00.000Z',
        description:
            'Fecha y hora en que el responsable recibe el recordatorio',
    })
    @Type(() => Date)
    @IsDate()
    fechaEnvio!: Date;

    @ApiProperty({ example: 1, description: 'ID de la plantilla de correo' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idTemplate!: number;

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
