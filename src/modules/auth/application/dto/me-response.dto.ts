import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { User } from '@/modules/users/domain/entities/user';

export class MeResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Juan' })
    nombres: string;

    @ApiProperty({ example: 'Pérez' })
    apellidos: string;

    @ApiProperty({ example: 'juan.perez@bioactiva.com' })
    correo: string;

    @ApiProperty({ enum: UserRole, example: UserRole.TRABAJADOR })
    role: UserRole;

    @ApiProperty({ enum: UserState, example: UserState.ACTIVO })
    estado: UserState;

    constructor(user: User) {
        this.id = user.id!;
        this.nombres = user.nombres;
        this.apellidos = user.apellidos;
        this.correo = user.correo;
        this.role = user.role;
        this.estado = user.estado;
    }
}
