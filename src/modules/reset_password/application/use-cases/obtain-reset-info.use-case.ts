import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    PASSWORD_RESET_REPOSITORY,
    type PasswordResetRepositoryPort,
} from '@/modules/reset_password/domain/ports/password-reset-repository.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';
import { maskEmail } from '@/shared/domain/utils/mask-email';

/**
 * Resuelve la URL del enlace de recuperación y devuelve el estado del token sin
 * mutarlo, para que el frontend muestre de inmediato si está expirado o ya usado
 * antes de mostrar el formulario. Espeja el flujo de activación de invitaciones
 * (ObtainInfoUseCase / GET /invitations/info/:token).
 */
export class ObtainResetInfoUseCase {
    constructor(
        @Inject(PASSWORD_RESET_REPOSITORY)
        private readonly passwordResetRepository: PasswordResetRepositoryPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(HashServicePort)
        private readonly hashService: HashServicePort,
    ) {}

    async execute(
        token: string,
    ): Promise<{ correo: string; expired: boolean; used: boolean }> {
        const tokenHash = this.hashService.hash(token);
        const resetToken =
            await this.passwordResetRepository.findByToken(tokenHash);
        if (!resetToken) {
            throw new InvalidResetTokenException('Token no encontrado');
        }

        const user = await this.userRepository.findById(resetToken.user_id);
        if (!user) {
            throw new InvalidResetTokenException(
                'Usuario asociado no encontrado',
            );
        }

        return {
            correo: maskEmail(user.correo),
            expired: resetToken.isExpired(),
            used: resetToken.isUsed(),
        };
    }
}
