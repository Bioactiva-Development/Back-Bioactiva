import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'miClaveActual123',
        description: 'Contraseña actual del usuario',
    })
    @IsString({ message: 'La contraseña actual debe ser texto.' })
    @IsNotEmpty({ message: 'La contraseña actual es obligatoria.' })
    currentPassword: string;

    @ApiProperty({
        example: 'miNuevaClaveSegura123',
        description: 'Nueva contraseña (entre 8 y 72 caracteres)',
    })
    @IsString({ message: 'La nueva contraseña debe ser texto.' })
    @MinLength(8, {
        message: 'La nueva contraseña debe tener al menos 8 caracteres.',
    })
    @MaxLength(72, {
        message: 'La nueva contraseña no debe superar los 72 caracteres.',
    })
    newPassword: string;
}
