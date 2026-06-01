import { Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { MicrosoftIntegrationController } from '@/modules/integrations/infrastructure/http/microsoft-integration.controller';
import { ConnectMicrosoftAccountUseCase } from '@/modules/integrations/application/use-cases/connect-microsoft-account.use-case';
import { MicrosoftOAuthCallbackUseCase } from '@/modules/integrations/application/use-cases/microsoft-oauth-callback.use-case';
import { GetMicrosoftConnectionStatusUseCase } from '@/modules/integrations/application/use-cases/get-microsoft-connection-status.use-case';
import { DisconnectMicrosoftAccountUseCase } from '@/modules/integrations/application/use-cases/disconnect-microsoft-account.use-case';
import { DirectConnectUseCase } from '@/modules/integrations/application/use-cases/direct-connect.use-case';
import { PrismaMicrosoftIntegrationRepository } from '@/modules/integrations/infrastructure/persistance/prisma-microsoft-integration.repository';
import { MICROSOFT_INTEGRATION_REPOSITORY } from '@/modules/integrations/domain/ports/microsoft-integration-repository.port';
import { MicrosoftGraphProvider } from '@/modules/integrations/infrastructure/provider/microsoft-graph-provider';
import { MICROSOFT_PROVIDER } from '@/modules/integrations/domain/ports/microsoft-provider.port';
import { MicrosoftAuthConfig } from '@/modules/integrations/infrastructure/config/microsoft-auth.config';

@Module({
    imports: [PrismaModule],
    controllers: [MicrosoftIntegrationController],
    providers: [
        MicrosoftAuthConfig,
        PrismaMicrosoftIntegrationRepository,
        {
            provide: MICROSOFT_INTEGRATION_REPOSITORY,
            useExisting: PrismaMicrosoftIntegrationRepository,
        },
        MicrosoftGraphProvider,
        {
            provide: MICROSOFT_PROVIDER,
            useExisting: MicrosoftGraphProvider,
        },
        ConnectMicrosoftAccountUseCase,
        MicrosoftOAuthCallbackUseCase,
        GetMicrosoftConnectionStatusUseCase,
        DisconnectMicrosoftAccountUseCase,
        DirectConnectUseCase,
    ],
})
export class MicrosoftIntegrationModule {}
