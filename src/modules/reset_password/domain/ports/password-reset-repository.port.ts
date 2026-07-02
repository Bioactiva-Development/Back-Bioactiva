import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';

export interface PasswordResetRepositoryPort {
    findById(id: number): Promise<PasswordResetToken | null>;
    findByToken(token: string): Promise<PasswordResetToken | null>;
    findPendingByEmail(correo: string): Promise<PasswordResetToken | null>;
    save(token: PasswordResetToken): Promise<PasswordResetToken>;
    /**
     * Marca el token como CONSUMIDO solo si sigue PENDIENTE, en una única
     * operación atómica. Devuelve false si otro proceso lo consumió o expiró
     * primero, garantizando que el token sea de un solo uso ante concurrencia.
     */
    consumePending(id: number): Promise<boolean>;
}

export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');
