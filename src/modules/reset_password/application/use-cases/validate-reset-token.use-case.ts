import { ResetTokenValidatorService } from '@/modules/reset_password/application/services/reset-token-validator.service';

export class ValidateResetTokenUseCase {
    constructor(
        private readonly tokenValidator: ResetTokenValidatorService,
    ) {}

    async execute(token: string): Promise<{ correo: string }> {
        const { user } = await this.tokenValidator.resolveValidToken(token);

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
