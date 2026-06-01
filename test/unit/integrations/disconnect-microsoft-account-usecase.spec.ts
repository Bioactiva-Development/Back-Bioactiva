import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DisconnectMicrosoftAccountUseCase } from '@/modules/integrations/application/use-cases/disconnect-microsoft-account.use-case';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';
import { MicrosoftIntegrationNotFoundException } from '@/modules/integrations/domain/exceptions/microsoft-integration-not-found.exception';

describe('Integrations module', () => {
    describe('DisconnectMicrosoftAccountUseCase', () => {
        let useCase: DisconnectMicrosoftAccountUseCase;
        let integrationRepository: any;

        const baseDate = new Date('2024-01-01T00:00:00.000Z');

        beforeEach(() => {
            integrationRepository = {
                findByUserId: jest.fn(),
                save: jest.fn(),
            };

            useCase = new DisconnectMicrosoftAccountUseCase(
                integrationRepository,
            );
        });

        it('should disconnect an existing integration', async () => {
            const integration = new MicrosoftIntegration(
                1,
                1,
                'user@example.com',
                'oid',
                'refresh',
                new Date('2025-01-01T00:00:00.000Z'),
                true,
                baseDate,
                baseDate,
            );
            integrationRepository.findByUserId.mockResolvedValue(integration);
            integrationRepository.save.mockResolvedValue(integration);

            const result = await useCase.execute(1);

            expect(integration.conectado).toBe(false);
            expect(integration.refreshToken).toBeNull();
            expect(integration.tokenExpiresAt).toBeNull();
            expect(integrationRepository.save).toHaveBeenCalledWith(
                integration,
            );
            expect(result).toEqual({ ok: true });
        });

        it('should throw when no integration exists', async () => {
            integrationRepository.findByUserId.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toThrow(
                MicrosoftIntegrationNotFoundException,
            );
        });
    });
});
