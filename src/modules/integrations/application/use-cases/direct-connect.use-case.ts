import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    MICROSOFT_INTEGRATION_REPOSITORY,
    type MicrosoftIntegrationRepositoryPort,
} from '@/modules/integrations/domain/ports/microsoft-integration-repository.port';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';
import { DirectConnectDto } from '@/modules/integrations/application/dto/direct-connect.dto';

export class DirectConnectUseCase {
    constructor(
        @Inject(MICROSOFT_INTEGRATION_REPOSITORY)
        private readonly integrationRepository: MicrosoftIntegrationRepositoryPort,
    ) {}

    async execute(
        userId: number,
        dto: DirectConnectDto,
    ): Promise<MicrosoftIntegration> {
        const expiresAt = dto.expiresIn
            ? new Date(Date.now() + dto.expiresIn * 1000)
            : null;

        let integration =
            await this.integrationRepository.findByUserId(userId);

        if (!integration) {
            integration = new MicrosoftIntegration(
                null,
                userId,
                dto.microsoftEmail,
                dto.microsoftOid,
                dto.refreshToken,
                expiresAt,
                false,
                new Date(),
                new Date(),
            );
        }

        integration.markAsConnected(
            dto.microsoftEmail,
            dto.microsoftOid,
            dto.refreshToken,
            expiresAt,
        );

        return await this.integrationRepository.save(integration);
    }
}
