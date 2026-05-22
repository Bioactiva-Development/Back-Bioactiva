import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestResetDto {
    constructor(correo: string) {
        this.correo = correo;
    }

    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
    correo: string;
}
