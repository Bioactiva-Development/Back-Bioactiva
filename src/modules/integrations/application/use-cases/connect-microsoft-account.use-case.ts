import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    MICROSOFT_PROVIDER,
    type MicrosoftProviderPort,
} from '@modules/integrations/domain/ports/microsoft-provider.port';
import { ConnectUrlDto } from '@/modules/integrations/application/dto/connect-url.dto';
import { sanitizeReturnPath } from '@/modules/integrations/application/microsoft-return-path';
import { randomUUID } from 'node:crypto';

export class ConnectMicrosoftAccountUseCase {
    constructor(
        @Inject(MICROSOFT_PROVIDER)
        private readonly microsoftProvider: MicrosoftProviderPort,
    ) {}

    /**
     * @param returnTo Ruta interna a la que volver tras el OAuth (p. ej.
     * "/notificaciones"). Viaja codificada dentro del `state` para reconstruir
     * el destino en el callback. Si no es válida, se usa la ruta por defecto.
     */
    async execute(userId: number, returnTo?: string): Promise<ConnectUrlDto> {
        const returnPath = sanitizeReturnPath(returnTo);
        const state = `${userId}:${randomUUID()}:${encodeURIComponent(returnPath)}`;
        const url = await this.microsoftProvider.getAuthUrl(state);
        return new ConnectUrlDto(url);
    }
}
