import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '@/shared/infrastructure/validators/is-strong-password.validator';

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

    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'Token de invitación recibido por correo',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        example: 'MiContraseña123',
        description: 'Contraseña del nuevo usuario',
    })
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @ApiProperty({
        example: 'MiContraseña123',
        description:
            'Confirmación de la contraseña (debe coincidir con password)',
    })
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;

    @ApiProperty({ example: 'Juan', description: 'Nombres del nuevo usuario' })
    @IsString()
    @IsNotEmpty()
    nombres: string;

    @ApiProperty({
        example: 'Pérez',
        description: 'Apellidos del nuevo usuario',
    })
    @IsString()
    @IsNotEmpty()
    apellidos: string;
}
