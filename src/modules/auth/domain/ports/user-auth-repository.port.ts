import { User } from '@/modules/users/domain/entities/user';

export interface AuthUserRepositoryPort {
    findByCorreo(correo: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    save(user: User): Promise<User>;
    /**
     * Incrementa de forma atómica la versión de sesión del usuario y devuelve
     * el nuevo valor. Invalida cualquier token emitido con una versión previa
     * (sesión única por cuenta — Mantis #271).
     */
    incrementTokenVersion(userId: number): Promise<number>;
}

export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');
