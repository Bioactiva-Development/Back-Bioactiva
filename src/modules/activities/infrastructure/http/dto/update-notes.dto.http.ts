import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class HttpUpdateNotesDto {
    @ApiProperty({
        example: 'Cliente solicitó reagendar la reunión para la próxima semana',
        description: 'Notas de la actividad',
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 1000)
    notas!: string;
}
