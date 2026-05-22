import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';

export interface PasswordResetRepositoryPort {
    findById(id: number): Promise<PasswordResetToken | null>;
    findByToken(token: string): Promise<PasswordResetToken | null>;
    findPendingByEmail(correo: string): Promise<PasswordResetToken | null>;
    save(token: PasswordResetToken): Promise<PasswordResetToken>;
}

export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');
