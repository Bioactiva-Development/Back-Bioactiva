import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    MICROSOFT_PROVIDER,
    type MicrosoftProviderPort,
} from '@modules/integrations/domain/ports/microsoft-provider.port';
import { ConnectUrlDto } from '@/modules/integrations/application/dto/connect-url.dto';
import { randomUUID } from 'node:crypto';

export class ConnectMicrosoftAccountUseCase {
    constructor(
        @Inject(MICROSOFT_PROVIDER)
        private readonly microsoftProvider: MicrosoftProviderPort,
    ) {}

    async execute(userId: number): Promise<ConnectUrlDto> {
        const state = `${userId}:${randomUUID()}`;
        const url = await this.microsoftProvider.getAuthUrl(state);
        return new ConnectUrlDto(url);
    }
}
