import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

export class UserResponseDto {
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

    @ApiProperty({ enum: UserState, example: 'ACTIVO' })
    estado: string;

    @ApiProperty({ example: '2026-01-15T10:30:00.000Z', description: 'Fecha de registro del usuario' })
    fechaRegistro: Date;

    constructor(user: User) {
        this.id = user.id!;
        this.nombres = user.nombres;
        this.apellidos = user.apellidos;
        this.correo = user.correo;
        this.rol = UserRole[user.role];
        this.estado = UserState[user.estado];
        this.fechaRegistro = user.created_at;
    }
}
