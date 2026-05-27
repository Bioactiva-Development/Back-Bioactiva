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

export class ValidateResetTokenUseCase {
    constructor(
        @Inject(PASSWORD_RESET_REPOSITORY)
        private readonly passwordResetRepository: PasswordResetRepositoryPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(HashServicePort)
        private readonly hashService: HashServicePort,
    ) {}

    async execute(token: string): Promise<{ correo: string }> {
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

        const [localPart, domain] = user.correo.split('@');
        const maskedLocalPart =
            localPart.length <= 2
                ? localPart[0] + '*'.repeat(localPart.length - 1)
                : localPart[0] +
                  '*'.repeat(localPart.length - 2) +
                  localPart.slice(-1);
        const correo = maskedLocalPart + '@' + domain;

        return { correo };
    }
}
