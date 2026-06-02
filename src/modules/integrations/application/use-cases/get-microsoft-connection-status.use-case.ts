import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    MICROSOFT_INTEGRATION_REPOSITORY,
    type MicrosoftIntegrationRepositoryPort,
} from '@/modules/integrations/domain/ports/microsoft-integration-repository.port';
import { ConnectionStatusDto } from '@/modules/integrations/application/dto/connection-status.dto';

export class GetMicrosoftConnectionStatusUseCase {
    constructor(
        @Inject(MICROSOFT_INTEGRATION_REPOSITORY)
        private readonly integrationRepository: MicrosoftIntegrationRepositoryPort,
    ) {}

    async execute(userId: number): Promise<ConnectionStatusDto> {
        const integration =
            await this.integrationRepository.findByUserId(userId);

        if (!integration || !integration.conectado) {
            return new ConnectionStatusDto(false, null);
        }

        return new ConnectionStatusDto(true, integration.microsoftEmail);
    }
}
