import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    PASSWORD_RESET_REPOSITORY,
    type PasswordResetRepositoryPort,
} from '@/modules/reset_password/domain/ports/password-reset-repository.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import {
    PASSWORD_HASHER,
    type PasswordHasherPort,
} from '@/modules/auth/domain/ports/password-hasher.port';
import { HashServicePort } from '@/shared/domain/ports/hash-service.port';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';
import { ResetTokenExpiredException } from '@/modules/reset_password/domain/exeptions/reset-token-expired.exception';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

export class ResetPasswordUseCase {
    constructor(
        @Inject(PASSWORD_RESET_REPOSITORY)
        private readonly passwordResetRepository: PasswordResetRepositoryPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasherPort,
        @Inject(HashServicePort)
        private readonly hashService: HashServicePort,
    ) {}

    async execute(
        token: string,
        newPassword: string,
    ): Promise<{ ok: boolean }> {
        // Calcular el hash del token recibido para buscarlo en base de datos
        const tokenHash = this.hashService.hash(token);

        const resetToken =
            await this.passwordResetRepository.findByToken(tokenHash);

        if (!resetToken || resetToken.estado !== TokenStatus.PENDIENTE) {
            throw new InvalidResetTokenException();
        }

        // Verificar expiración del token
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

        // Encriptar la nueva contraseña
        const hashedPassword = await this.passwordHasher.hash(newPassword);

        // Actualizar contraseña y guardar
        user.updatePassword(hashedPassword);
        await this.userRepository.save(user);

        // Consumir el token y guardar su estado
        resetToken.consume();
        await this.passwordResetRepository.save(resetToken);

        return { ok: true };
    }
}
