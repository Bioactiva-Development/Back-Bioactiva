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

        const hashedPassword = await this.passwordHasher.hash(newPassword);

        user.updatePassword(hashedPassword);
        await this.userRepository.save(user);

        resetToken.consume();
        await this.passwordResetRepository.save(resetToken);

        return { ok: true };
    }
}
