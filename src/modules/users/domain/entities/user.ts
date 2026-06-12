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
        public role: UserRole,
        public estado: UserState,
        public updated_at: Date,
        /**
         * Versión de sesión. Cada autenticación nueva la incrementa, por lo que
         * los tokens emitidos con una versión anterior dejan de ser válidos
         * (sesión única por cuenta — Mantis #271).
         */
        public tokenVersion: number = 0,
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

    /** Actualiza los datos personales propios (Mantis #333). */
    rename(nombres?: string, apellidos?: string) {
        if (nombres !== undefined) {
            this.nombres = nombres.trim();
        }
        if (apellidos !== undefined) {
            this.apellidos = apellidos.trim();
        }
        this.updated_at = new Date();
    }

    /** Cambia el rol del usuario (acción reservada al administrador). */
    changeRole(role: UserRole) {
        this.role = role;
        this.updated_at = new Date();
    }

    /**
     * Avanza la versión de sesión para invalidar los tokens vigentes. Se usa,
     * por ejemplo, al cambiar el rol para forzar que el nuevo rol surta efecto
     * de inmediato en lugar de esperar a la expiración del token (ver [[Mantis
     * #271]] — sesión única por cuenta).
     */
    bumpTokenVersion() {
        this.tokenVersion += 1;
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
