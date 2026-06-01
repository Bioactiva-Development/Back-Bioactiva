import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MicrosoftOAuthCallbackUseCase } from '@/modules/integrations/application/use-cases/microsoft-oauth-callback.use-case';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';

describe('Integrations module', () => {
    describe('MicrosoftOAuthCallbackUseCase', () => {
        let useCase: MicrosoftOAuthCallbackUseCase;
        let integrationRepository: any;
        let microsoftProvider: any;

        const baseDate = new Date('2024-01-01T00:00:00.000Z');

        beforeEach(() => {
            integrationRepository = {
                findByUserId: jest.fn(),
                save: jest.fn(),
            };

            microsoftProvider = {
                getAuthUrl: jest.fn(),
                exchangeCodeForTokens: jest.fn(),
                getProfile: jest.fn(),
                refreshAccessToken: jest.fn(),
            };

            useCase = new MicrosoftOAuthCallbackUseCase(
                integrationRepository,
                microsoftProvider,
            );
        });

        it('should create a new integration when none exists', async () => {
            microsoftProvider.exchangeCodeForTokens.mockResolvedValue({
                accessToken: 'access-token',
                expiresIn: 3600,
            });
            microsoftProvider.getProfile.mockResolvedValue({
                email: 'user@example.com',
                oid: 'oid-123',
            });
            integrationRepository.findByUserId.mockResolvedValue(null);
            integrationRepository.save.mockImplementation(
                (integration: MicrosoftIntegration) =>
                    Promise.resolve(integration),
            );

            const result = await useCase.execute('auth-code', 1);

            expect(result.idUsuario).toBe(1);
            expect(result.microsoftEmail).toBe('user@example.com');
            expect(result.microsoftOid).toBe('oid-123');
            expect(result.conectado).toBe(true);
            expect(integrationRepository.save).toHaveBeenCalledTimes(1);
        });

        it('should update existing integration', async () => {
            const existingIntegration = new MicrosoftIntegration(
                1,
                1,
                'old@example.com',
                'old-oid',
                null,
                null,
                false,
                baseDate,
                baseDate,
            );

            microsoftProvider.exchangeCodeForTokens.mockResolvedValue({
                accessToken: 'new-access-token',
                expiresIn: 7200,
            });
            microsoftProvider.getProfile.mockResolvedValue({
                email: 'new@example.com',
                oid: 'new-oid',
            });
            integrationRepository.findByUserId.mockResolvedValue(
                existingIntegration,
            );
            integrationRepository.save.mockImplementation(
                (integration: MicrosoftIntegration) =>
                    Promise.resolve(integration),
            );

            const result = await useCase.execute('auth-code', 1);

            expect(result.microsoftEmail).toBe('new@example.com');
            expect(result.microsoftOid).toBe('new-oid');
            expect(result.conectado).toBe(true);
        });

        it('should handle missing expiration time', async () => {
            microsoftProvider.exchangeCodeForTokens.mockResolvedValue({
                accessToken: 'access-token',
                expiresIn: undefined,
            });
            microsoftProvider.getProfile.mockResolvedValue({
                email: 'user@example.com',
                oid: 'oid-123',
            });
            integrationRepository.findByUserId.mockResolvedValue(null);
            integrationRepository.save.mockImplementation(
                (integration: MicrosoftIntegration) =>
                    Promise.resolve(integration),
            );

            const result = await useCase.execute('auth-code', 1);

            expect(result.tokenExpiresAt).toBeNull();
        });
    });
});
