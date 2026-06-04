import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '@/shared/domain/enums/rol';

export class User {
    constructor(
        public readonly id: number | null,
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
    public canAuthenticate(): boolean {
        return this.estado === UserState.ACTIVO;
    }

    /**
     * Un usuario es provisional cuando fue creado por una invitación pero aún
     * no completó su registro (no tiene contraseña). Sirve para distinguir a
     * los usuarios huérfanos de invitaciones canceladas/expiradas de las
     * cuentas reales ya registradas.
     */
    public isProvisional(): boolean {
        return this.password.trim().length === 0;
    }
}
