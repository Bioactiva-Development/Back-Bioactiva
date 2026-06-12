import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({
        example: 'Juan',
        description: 'Nombres del usuario',
    })
    @IsOptional()
    @IsString({ message: 'Los nombres deben ser texto.' })
    @Length(1, 90, {
        message: 'Los nombres deben tener entre 1 y 90 caracteres.',
    })
    nombres?: string;

    @ApiPropertyOptional({
        example: 'Pérez',
        description: 'Apellidos del usuario',
    })
    @IsOptional()
    @IsString({ message: 'Los apellidos deben ser texto.' })
    @Length(1, 90, {
        message: 'Los apellidos deben tener entre 1 y 90 caracteres.',
    })
    apellidos?: string;
}
