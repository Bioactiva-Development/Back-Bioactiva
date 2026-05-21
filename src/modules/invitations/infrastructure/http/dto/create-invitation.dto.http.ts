import { UserRole } from '@/shared/domain/enums/rol';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInvitationDto {
    constructor(correo: string, rol: UserRole) {
        this.correo = correo;
        this.rol = rol;
    }
    @IsEmail()
    correo: string;
    @IsEnum(UserRole)
    rol: UserRole;
}
