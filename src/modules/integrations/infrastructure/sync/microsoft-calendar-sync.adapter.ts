import { Injectable } from '@nestjs/common';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    type CalendarSyncPort,
    type CalendarEventInput,
} from '@/modules/integrations/domain/ports/calendar-sync.port';
import {
    MICROSOFT_INTEGRATION_REPOSITORY,
    type MicrosoftIntegrationRepositoryPort,
} from '@/modules/integrations/domain/ports/microsoft-integration-repository.port';
import {
    MICROSOFT_PROVIDER,
    type MicrosoftProviderPort,
} from '@/modules/integrations/domain/ports/microsoft-provider.port';
import { MicrosoftGraphRequestException } from '@/modules/integrations/domain/exceptions/microsoft-graph-request.exception';

@Injectable()
export class MicrosoftCalendarSyncAdapter implements CalendarSyncPort {
    constructor(
        @Inject(MICROSOFT_INTEGRATION_REPOSITORY)
        private readonly integrationRepository: MicrosoftIntegrationRepositoryPort,
        @Inject(MICROSOFT_PROVIDER)
        private readonly microsoftProvider: MicrosoftProviderPort,
    ) {}

    async isUserConnected(userId: number): Promise<boolean> {
        const integration =
            await this.integrationRepository.findByUserId(userId);
        return Boolean(
            integration?.conectado && integration.refreshToken,
        );
    }

    async createCalendarEvent(
        userId: number,
        input: CalendarEventInput,
    ): Promise<string> {
        const accessToken = await this.getAccessToken(userId);
        return this.microsoftProvider.createCalendarEvent(accessToken, input);
    }

    async updateCalendarEvent(
        userId: number,
        eventId: string,
        input: CalendarEventInput,
    ): Promise<void> {
        const accessToken = await this.getAccessToken(userId);
        await this.microsoftProvider.updateCalendarEvent(
            accessToken,
            eventId,
            input,
        );
    }

    async deleteCalendarEvent(userId: number, eventId: string): Promise<void> {
        const accessToken = await this.getAccessToken(userId);
        await this.microsoftProvider.deleteCalendarEvent(accessToken, eventId);
    }

    async createTeamsMeeting(
        userId: number,
        input: CalendarEventInput,
    ): Promise<string> {
        const accessToken = await this.getAccessToken(userId);
        return this.microsoftProvider.createTeamsMeeting(accessToken, input);
    }

    /**
     * Obtiene un access token fresco a partir del refresh token almacenado y
     * persiste la rotación del refresh token cuando Microsoft devuelve uno nuevo.
     */
    private async getAccessToken(userId: number): Promise<string> {
        const integration =
            await this.integrationRepository.findByUserId(userId);

        if (!integration?.conectado || !integration.refreshToken) {
            throw new MicrosoftGraphRequestException(
                `El usuario ${userId} no tiene Microsoft conectado`,
            );
        }

        const tokens = await this.microsoftProvider.refreshAccessToken(
            integration.refreshToken,
        );

        if (tokens.refreshToken && tokens.refreshToken !== integration.refreshToken) {
            integration.refreshToken = tokens.refreshToken;
            integration.tokenExpiresAt = tokens.expiresIn
                ? new Date(Date.now() + tokens.expiresIn * 1000)
                : integration.tokenExpiresAt;
            integration.updatedAt = new Date();
            await this.integrationRepository.save(integration);
        }

        return tokens.accessToken;
    }
}
