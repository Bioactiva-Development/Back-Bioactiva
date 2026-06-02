import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';

export interface MicrosoftIntegrationRepositoryPort {
    findByUserId(userId: number): Promise<MicrosoftIntegration | null>;
    save(integration: MicrosoftIntegration): Promise<MicrosoftIntegration>;
}

export const MICROSOFT_INTEGRATION_REPOSITORY = Symbol(
    'MICROSOFT_INTEGRATION_REPOSITORY',
);
