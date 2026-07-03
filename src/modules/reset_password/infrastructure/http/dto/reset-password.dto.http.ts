import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '@/shared/infrastructure/validators/is-strong-password.validator';

export class ResetPasswordDto {
    constructor(token: string, password: string, confirmPassword: string) {
        this.token = token;
        this.password = password;
        this.confirmPassword = confirmPassword;
    }

    @ApiProperty({
        description: 'Token de recuperación recibido por correo',
        example: 'b3f1c2e4-...-uuid',
    })
    @IsNotEmpty({ message: 'El token es obligatorio' })
    @IsString()
    token: string;

    @ApiProperty({
        description: 'Nueva contraseña (debe ser una contraseña fuerte)',
        example: 'NuevaPassw0rd!',
    })
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @IsString()
    @IsStrongPassword()
    password: string;

    @ApiProperty({
        description:
            'Confirmación de la nueva contraseña (debe coincidir con password)',
        example: 'NuevaPassw0rd!',
    })
    @IsNotEmpty({ message: 'La confirmación de la contraseña es obligatoria' })
    @IsString()
    confirmPassword: string;
}
