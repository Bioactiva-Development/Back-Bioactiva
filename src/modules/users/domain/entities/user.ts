import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '@/shared/enums/rol';

export class User {
    constructor(
        public readonly id: string,
        public nombres: string,
        public apellidos: string,
        public correo: string,
        public password: string,
        public readonly createdAt: Date,
        public readonly role: UserRole,
        public estado: UserState,
        public updatedAt: Date,
    ) {}
    deactivate() {
        if (this.estado === UserState.SUSPENDIDO) {
            throw new Error('El usuario ya está suspendido');
        }
        this.estado = UserState.SUSPENDIDO;
    }
}
