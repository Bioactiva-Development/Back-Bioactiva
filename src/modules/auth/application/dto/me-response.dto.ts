import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { User } from '@/modules/users/domain/entities/user';

export class MeResponseDto {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    role: UserRole;
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
