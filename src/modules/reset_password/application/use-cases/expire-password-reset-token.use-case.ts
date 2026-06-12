import { Inject } from '@shared/infrastructure/dependency-inyection/inyect';
import {
    PASSWORD_RESET_REPOSITORY,
    type PasswordResetRepositoryPort,
} from '@/modules/reset_password/domain/ports/password-reset-repository.port';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

export class ExpirePasswordResetTokenUseCase {
    constructor(
        @Inject(PASSWORD_RESET_REPOSITORY)
        private readonly passwordResetRepository: PasswordResetRepositoryPort,
    ) {}

    async execute(id: number): Promise<boolean> {
        const token = await this.passwordResetRepository.findById(id);
        if (!token) return false;

        if (token.estado !== TokenStatus.PENDIENTE) {
            return false;
        }

        token.expire();
        await this.passwordResetRepository.save(token);
        return true;
    }
}
