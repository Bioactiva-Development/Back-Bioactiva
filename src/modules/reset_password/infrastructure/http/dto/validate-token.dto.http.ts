import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateTokenDto {
    constructor(token: string) {
        this.token = token;
    }

    @ApiProperty({
        description: 'Token de recuperación de contraseña a validar',
        example: 'b3f1c2e4-...-uuid',
    })
    @IsNotEmpty({ message: 'El token es obligatorio' })
    @IsString()
    token: string;
}
