import { UserRole } from '@/shared/domain/enums/rol';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInvitationDto {
    constructor(correo: string, rol: UserRole) {
        this.correo = correo;
        this.rol = rol;
    }

    @ApiProperty({
        example: 'nuevo.usuario@bioactiva.com',
        description: 'Correo del usuario a invitar (debe ser un dominio permitido)',
    })
    @IsEmail()
    correo: string;

    @ApiProperty({
        enum: UserRole,
        example: UserRole.TRABAJADOR,
        description: 'Rol que tendrá el usuario invitado',
    })
    @IsEnum(UserRole)
    rol: UserRole;
}
