import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
    constructor(correo: string, password: string) {
        this.correo = correo;
        this.password = password;
    }
    @IsNotEmpty()
    @IsEmail()
    correo: string;

    @IsNotEmpty()
    password: string;
}
