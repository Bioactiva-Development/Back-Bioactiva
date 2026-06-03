import { Injectable } from '@nestjs/common';
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
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';
import { ResetTokenExpiredException } from '@/modules/reset_password/domain/exeptions/reset-token-expired.exception';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { User } from '@/modules/users/domain/entities/user';

/**
 * Lógica compartida de validación de un token de recuperación de contraseña:
 * hashea el token, lo busca, valida que esté PENDIENTE y vigente, y recupera el
 * usuario asociado. Centraliza el flujo que antes estaba duplicado en
 * ResetPasswordUseCase y ValidateResetTokenUseCase.
 */
@Injectable()
export class ResetTokenValidatorService {
    constructor(
        @Inject(PASSWORD_RESET_REPOSITORY)
        private readonly passwordResetRepository: PasswordResetRepositoryPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(HashServicePort)
        private readonly hashService: HashServicePort,
    ) {}

    /**
     * Devuelve el token y el usuario asociado si el token es válido (PENDIENTE y
     * no expirado). Si está expirado, lo marca como EXPIRADO antes de lanzar.
     *
     * @throws InvalidResetTokenException si el token no existe, no está
     *   pendiente, o no tiene usuario asociado.
     * @throws ResetTokenExpiredException si el token superó su fecha de expiración.
     */
    async resolveValidToken(
        token: string,
    ): Promise<{ resetToken: PasswordResetToken; user: User }> {
        const tokenHash = this.hashService.hash(token);
        const resetToken =
            await this.passwordResetRepository.findByToken(tokenHash);

        if (resetToken?.estado !== TokenStatus.PENDIENTE) {
            throw new InvalidResetTokenException();
        }

        if (resetToken.expired_at < new Date()) {
            resetToken.estado = TokenStatus.EXPIRADO;
            await this.passwordResetRepository.save(resetToken);
            throw new ResetTokenExpiredException();
        }

        const user = await this.userRepository.findById(resetToken.user_id);
        if (!user) {
            throw new InvalidResetTokenException(
                'Usuario asociado no encontrado',
            );
        }

        return { resetToken, user };
    }
}
