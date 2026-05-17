import { IsNotEmpty } from 'class-validator';

export class LoginDto {
    constructor(correo: string, password: string) {
        this.correo = correo;
        this.password = password;
    }
    @IsNotEmpty()
    correo: string;

    @IsNotEmpty()
    password: string;
}
