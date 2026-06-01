import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetMicrosoftConnectionStatusUseCase } from '@/modules/integrations/application/use-cases/get-microsoft-connection-status.use-case';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';
import { ConnectionStatusDto } from '@/modules/integrations/application/dto/connection-status.dto';

describe('Integrations module', () => {
    describe('GetMicrosoftConnectionStatusUseCase', () => {
        let useCase: GetMicrosoftConnectionStatusUseCase;
        let integrationRepository: any;

        const baseDate = new Date('2024-01-01T00:00:00.000Z');

        beforeEach(() => {
            integrationRepository = {
                findByUserId: jest.fn(),
                save: jest.fn(),
            };

            useCase = new GetMicrosoftConnectionStatusUseCase(
                integrationRepository,
            );
        });

        it('should return connected status when integration exists', async () => {
            const integration = new MicrosoftIntegration(
                1,
                1,
                'user@example.com',
                'oid',
                null,
                null,
                true,
                baseDate,
                baseDate,
            );
            integrationRepository.findByUserId.mockResolvedValue(
                integration,
            );

            const result = await useCase.execute(1);

            expect(result).toBeInstanceOf(ConnectionStatusDto);
            expect(result.connected).toBe(true);
            expect(result.microsoftEmail).toBe('user@example.com');
        });

        it('should return disconnected when no integration exists', async () => {
            integrationRepository.findByUserId.mockResolvedValue(null);

            const result = await useCase.execute(1);

            expect(result.connected).toBe(false);
            expect(result.microsoftEmail).toBeNull();
        });

        it('should return disconnected when integration exists but not connected', async () => {
            const integration = new MicrosoftIntegration(
                1,
                1,
                'user@example.com',
                'oid',
                null,
                null,
                false,
                baseDate,
                baseDate,
            );
            integrationRepository.findByUserId.mockResolvedValue(
                integration,
            );

            const result = await useCase.execute(1);

            expect(result.connected).toBe(false);
            expect(result.microsoftEmail).toBeNull();
        });
    });
});
