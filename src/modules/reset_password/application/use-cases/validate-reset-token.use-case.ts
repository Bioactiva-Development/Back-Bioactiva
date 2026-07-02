import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { ResetTokenValidatorService } from '@/modules/reset_password/application/services/reset-token-validator.service';
import { maskEmail } from '@/shared/domain/utils/mask-email';

@Injectable()
export class ValidateResetTokenUseCase {
    constructor(private readonly tokenValidator: ResetTokenValidatorService) {}

    async execute(token: string): Promise<{ correo: string }> {
        const { user } = await this.tokenValidator.resolveValidToken(token);

        return { correo: maskEmail(user.correo) };
    }
}
