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
import { ResetTokenValidatorService } from '@/modules/reset_password/application/services/reset-token-validator.service';
import { InvalidResetTokenException } from '@/modules/reset_password/domain/exeptions/invalid-reset-token.exception';

export class ResetPasswordUseCase {
    constructor(
        private readonly tokenValidator: ResetTokenValidatorService,
        @Inject(PASSWORD_RESET_REPOSITORY)
        private readonly passwordResetRepository: PasswordResetRepositoryPort,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(PASSWORD_HASHER)
        private readonly passwordHasher: PasswordHasherPort,
    ) {}

    async execute(
        token: string,
        newPassword: string,
    ): Promise<{ ok: boolean }> {
        const { resetToken, user } =
            await this.tokenValidator.resolveValidToken(token);

        // Consumir el token ANTES de cambiar la contraseña, con una operación
        // condicional: ante dos requests concurrentes con el mismo token solo
        // una gana, y si el guardado posterior falla el token queda quemado
        // (fail-closed) en vez de dejar la contraseña cambiada con un token
        // aún reutilizable.
        const consumed = await this.passwordResetRepository.consumePending(
            resetToken.id!,
        );
        if (!consumed) {
            throw new InvalidResetTokenException();
        }

        const hashedPassword = await this.passwordHasher.hash(newPassword);

        user.updatePassword(hashedPassword);
        await this.userRepository.save(user);

        return { ok: true };
    }
}
