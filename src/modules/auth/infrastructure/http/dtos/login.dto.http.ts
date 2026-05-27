import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
    constructor(correo: string, password: string) {
        this.correo = correo;
        this.password = password;
    }
    @ApiProperty({
        type: String,
        description: 'Correo electrónico del usuario',
        example: 'user@example.com',
    })
    @IsNotEmpty()
    @IsEmail()
    correo: string;

    @ApiProperty({
        type: String,
        description: 'Contraseña del usuario',
        example: 'password123',
    })
    @IsNotEmpty()
    password: string;
}
