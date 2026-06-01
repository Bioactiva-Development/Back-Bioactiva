import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    MICROSOFT_INTEGRATION_REPOSITORY,
    type MicrosoftIntegrationRepositoryPort,
} from '@/modules/integrations/domain/ports/microsoft-integration-repository.port';
import { MicrosoftIntegrationNotFoundException } from '@/modules/integrations/domain/exceptions/microsoft-integration-not-found.exception';

export class DisconnectMicrosoftAccountUseCase {
    constructor(
        @Inject(MICROSOFT_INTEGRATION_REPOSITORY)
        private readonly integrationRepository: MicrosoftIntegrationRepositoryPort,
    ) {}

    async execute(userId: number): Promise<{ ok: boolean }> {
        const integration =
            await this.integrationRepository.findByUserId(userId);

        if (!integration) {
            throw new MicrosoftIntegrationNotFoundException(
                'No hay integración Microsoft asociada a este usuario',
            );
        }

        integration.disconnect();

        await this.integrationRepository.save(integration);

        return { ok: true };
    }
}
