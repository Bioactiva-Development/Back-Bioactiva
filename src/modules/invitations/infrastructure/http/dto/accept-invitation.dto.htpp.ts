import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptInvitationDto {
    constructor(
        token: string,
        password: string,
        nombres: string,
        apellidos: string,
        confirmPassword: string,
    ) {
        this.token = token;
        this.password = password;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.confirmPassword = confirmPassword;
    }
    @IsString()
    @IsNotEmpty()
    token: string;
    @IsString()
    @IsNotEmpty()
    password: string;
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
    @IsString()
    @IsNotEmpty()
    nombres: string;
    @IsString()
    @IsNotEmpty()
    apellidos: string;
}
