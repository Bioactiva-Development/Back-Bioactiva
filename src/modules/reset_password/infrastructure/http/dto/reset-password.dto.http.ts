import { IsNotEmpty, IsString, MinLength } from 'class-validator';

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
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @IsNotEmpty({ message: 'La confirmación de la contraseña es obligatoria' })
    @IsString()
    confirmPassword: string;
}
