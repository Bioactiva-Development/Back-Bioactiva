import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';

/**
 * Representación de un usuario habilitado para un selector de asignación
 * (encargado de un lead, etc.).
 */
export class AssignableUserResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Juan' })
    nombres: string;

    @ApiProperty({ example: 'Pérez' })
    apellidos: string;

    @ApiProperty({ example: 'juan@example.com' })
    correo: string;

    @ApiProperty({ enum: UserRole, example: 'TRABAJADOR' })
    rol: string;

    constructor(user: User) {
        this.id = user.id!;
        this.nombres = user.nombres;
        this.apellidos = user.apellidos;
        this.correo = user.correo;
        this.rol = UserRole[user.role];
    }
}
