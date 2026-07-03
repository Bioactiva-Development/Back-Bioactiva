import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestResetDto {
    constructor(correo: string) {
        this.correo = correo;
    }

    @ApiProperty({
        description: 'Correo electrónico de la cuenta a recuperar',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
    correo: string;
}
