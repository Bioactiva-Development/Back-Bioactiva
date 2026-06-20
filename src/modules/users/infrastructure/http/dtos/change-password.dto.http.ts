import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '@/shared/infrastructure/validators/is-strong-password.validator';

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
    @IsStrongPassword()
    newPassword: string;
}
