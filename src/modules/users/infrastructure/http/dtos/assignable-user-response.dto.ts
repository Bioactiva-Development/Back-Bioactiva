import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';

/**
 * Representación mínima de un usuario habilitado para un selector de asignación
 * (no expone correo ni estado: solo lo necesario para elegir un encargado).
 */
export class AssignableUserResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Juan' })
    nombres: string;

    @ApiProperty({ example: 'Pérez' })
    apellidos: string;

    @ApiProperty({ enum: UserRole, example: 'TRABAJADOR' })
    rol: string;

    constructor(user: User) {
        this.id = user.id!;
        this.nombres = user.nombres;
        this.apellidos = user.apellidos;
        this.rol = UserRole[user.role];
    }
}
