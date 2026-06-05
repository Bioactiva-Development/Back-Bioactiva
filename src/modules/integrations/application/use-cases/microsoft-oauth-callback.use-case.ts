import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    MICROSOFT_INTEGRATION_REPOSITORY,
    type MicrosoftIntegrationRepositoryPort,
} from '@/modules/integrations/domain/ports/microsoft-integration-repository.port';
import {
    MICROSOFT_PROVIDER,
    type MicrosoftProviderPort,
} from '@/modules/integrations/domain/ports/microsoft-provider.port';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';

export class MicrosoftOAuthCallbackUseCase {
    constructor(
        @Inject(MICROSOFT_INTEGRATION_REPOSITORY)
        private readonly integrationRepository: MicrosoftIntegrationRepositoryPort,
        @Inject(MICROSOFT_PROVIDER)
        private readonly microsoftProvider: MicrosoftProviderPort,
    ) {}

    async execute(code: string, userId: number): Promise<MicrosoftIntegration> {
        const tokenResponse =
            await this.microsoftProvider.exchangeCodeForTokens(code);

        const profile = await this.microsoftProvider.getProfile(
            tokenResponse.accessToken,
        );

        const refreshToken = tokenResponse.refreshToken ?? null;
        const expiresAt = tokenResponse.expiresIn
            ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
            : null;

        let integration = await this.integrationRepository.findByUserId(userId);

        if (!integration) {
            integration = new MicrosoftIntegration(
                null,
                userId,
                profile.email,
                profile.oid,
                refreshToken,
                expiresAt,
                false,
                new Date(),
                new Date(),
            );
        }

        integration.markAsConnected(
            profile.email,
            profile.oid,
            refreshToken,
            expiresAt,
        );

        return await this.integrationRepository.save(integration);
    }
}
