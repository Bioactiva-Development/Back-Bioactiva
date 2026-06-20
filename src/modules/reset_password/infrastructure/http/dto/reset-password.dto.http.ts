import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '@/shared/infrastructure/validators/is-strong-password.validator';

export class ResetPasswordDto {
    constructor(token: string, password: string, confirmPassword: string) {
        this.token = token;
        this.password = password;
        this.confirmPassword = confirmPassword;
    }
    @IsNotEmpty({ message: 'El token es obligatorio' })
    @IsString()
    token: string;

    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @IsString()
    @IsStrongPassword()
    password: string;

    @IsNotEmpty({ message: 'La confirmación de la contraseña es obligatoria' })
    @IsString()
    confirmPassword: string;
}
