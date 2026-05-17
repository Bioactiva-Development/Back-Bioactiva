import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '@/shared/enums/rol';

export class User {
    constructor(
        public readonly id: number,
        public nombres: string,
        public apellidos: string,
        public correo: string,
        public password: string,
        public readonly created_at: Date,
        public readonly role: UserRole,
        public estado: UserState,
        public updated_at: Date,
    ) {}
    activate() {
        if (this.estado === UserState.ACTIVO) {
            throw new Error('El usuario ya está activo');
        }
        this.estado = UserState.ACTIVO;
    }

    deactivate() {
        if (this.estado === UserState.SUSPENDIDO) {
            throw new Error('El usuario ya está suspendido');
        }
        this.estado = UserState.SUSPENDIDO;
    }

    updatePassword(password: string) {
        if (!password.trim()) {
            throw new Error('La contraseña no puede estar vacía');
        }
        this.password = password;
        this.updated_at = new Date();
    }
}
