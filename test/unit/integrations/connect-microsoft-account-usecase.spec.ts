import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ConnectMicrosoftAccountUseCase } from '@/modules/integrations/application/use-cases/connect-microsoft-account.use-case';

describe('Integrations module', () => {
    describe('ConnectMicrosoftAccountUseCase', () => {
        let useCase: ConnectMicrosoftAccountUseCase;
        let microsoftProvider: any;

        beforeEach(() => {
            microsoftProvider = {
                getAuthUrl: jest.fn(),
                exchangeCodeForTokens: jest.fn(),
                getProfile: jest.fn(),
                refreshAccessToken: jest.fn(),
            };

            useCase = new ConnectMicrosoftAccountUseCase(microsoftProvider);
        });

        it('should return a connect URL for a given user', async () => {
            microsoftProvider.getAuthUrl.mockResolvedValue(
                'https://login.microsoftonline.com/...',
            );

            const result = await useCase.execute(1);

            expect(microsoftProvider.getAuthUrl).toHaveBeenCalledWith(
                expect.stringMatching(/^1:/),
            );
            expect(result.url).toBe(
                'https://login.microsoftonline.com/...',
            );
        });
    });
});
