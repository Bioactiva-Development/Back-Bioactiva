import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MicrosoftCalendarSyncAdapter } from '@/modules/integrations/infrastructure/sync/microsoft-calendar-sync.adapter';
import { MicrosoftGraphRequestException } from '@/modules/integrations/domain/exceptions/microsoft-graph-request.exception';

/**
 * MicrosoftCalendarSyncAdapter (cobertura de ramas)
 * -------------------------------------------------
 * Complementa el spec base cubriendo update/delete, la rotación del refresh
 * token sin expiresIn y el caso de usuario sin integración conectada.
 */
describe('Integrations module', () => {
    describe('MicrosoftCalendarSyncAdapter branches', () => {
        let adapter: MicrosoftCalendarSyncAdapter;
        let integrationRepository: any;
        let microsoftProvider: any;

        const connectedIntegration = () => ({
            conectado: true,
            refreshToken: 'refresh-old',
            tokenExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        });

        const eventInput = {
            subject: 'Reunión',
            start: new Date('2026-06-01T10:00:00.000Z'),
            end: new Date('2026-06-01T11:00:00.000Z'),
            body: 'notas',
        };

        beforeEach(() => {
            integrationRepository = {
                findByUserId: jest.fn(),
                save: jest.fn(),
            };
            microsoftProvider = {
                refreshAccessToken: jest.fn(),
                createCalendarEvent: jest.fn(),
                updateCalendarEvent: jest.fn(),
                deleteCalendarEvent: jest.fn(),
            };
            adapter = new MicrosoftCalendarSyncAdapter(
                integrationRepository,
                microsoftProvider,
            );
        });

        describe('updateCalendarEvent', () => {
            it('resolves a token and forwards to the provider', async () => {
                integrationRepository.findByUserId.mockResolvedValue(
                    connectedIntegration(),
                );
                microsoftProvider.refreshAccessToken.mockResolvedValue({
                    accessToken: 'access-1',
                    refreshToken: 'refresh-old',
                });

                await adapter.updateCalendarEvent(1, 'evt-1', eventInput);

                expect(
                    microsoftProvider.updateCalendarEvent,
                ).toHaveBeenCalledWith('access-1', 'evt-1', eventInput);
            });

            it('throws when the user is not connected', async () => {
                integrationRepository.findByUserId.mockResolvedValue({
                    conectado: false,
                    refreshToken: 'x',
                });

                await expect(
                    adapter.updateCalendarEvent(1, 'evt-1', eventInput),
                ).rejects.toThrow(MicrosoftGraphRequestException);
            });
        });

        describe('deleteCalendarEvent', () => {
            it('resolves a token and forwards to the provider', async () => {
                integrationRepository.findByUserId.mockResolvedValue(
                    connectedIntegration(),
                );
                microsoftProvider.refreshAccessToken.mockResolvedValue({
                    accessToken: 'access-1',
                    refreshToken: 'refresh-old',
                });

                await adapter.deleteCalendarEvent(1, 'evt-1');

                expect(
                    microsoftProvider.deleteCalendarEvent,
                ).toHaveBeenCalledWith('access-1', 'evt-1');
            });

            it('throws when there is no integration at all', async () => {
                integrationRepository.findByUserId.mockResolvedValue(null);

                await expect(
                    adapter.deleteCalendarEvent(1, 'evt-1'),
                ).rejects.toThrow(MicrosoftGraphRequestException);
            });
        });

        describe('refresh token rotation branches', () => {
            it('keeps the existing tokenExpiresAt when expiresIn is absent', async () => {
                const integration = connectedIntegration();
                const previousExpiry = integration.tokenExpiresAt;
                integrationRepository.findByUserId.mockResolvedValue(
                    integration,
                );
                microsoftProvider.refreshAccessToken.mockResolvedValue({
                    accessToken: 'access-1',
                    refreshToken: 'refresh-new',
                    // expiresIn ausente -> conserva tokenExpiresAt previo
                });
                microsoftProvider.deleteCalendarEvent.mockResolvedValue(
                    undefined,
                );

                await adapter.deleteCalendarEvent(1, 'evt-1');

                expect(integration.refreshToken).toBe('refresh-new');
                expect(integration.tokenExpiresAt).toBe(previousExpiry);
                expect(integrationRepository.save).toHaveBeenCalledWith(
                    integration,
                );
            });

            it('does not persist when Microsoft returns no refresh token', async () => {
                const integration = connectedIntegration();
                integrationRepository.findByUserId.mockResolvedValue(
                    integration,
                );
                microsoftProvider.refreshAccessToken.mockResolvedValue({
                    accessToken: 'access-1',
                    // sin refreshToken
                });
                microsoftProvider.deleteCalendarEvent.mockResolvedValue(
                    undefined,
                );

                await adapter.deleteCalendarEvent(1, 'evt-1');

                expect(integrationRepository.save).not.toHaveBeenCalled();
            });

            it('does not persist when the refresh token is unchanged', async () => {
                const integration = connectedIntegration();
                integrationRepository.findByUserId.mockResolvedValue(
                    integration,
                );
                microsoftProvider.refreshAccessToken.mockResolvedValue({
                    accessToken: 'access-1',
                    refreshToken: 'refresh-old',
                });
                microsoftProvider.deleteCalendarEvent.mockResolvedValue(
                    undefined,
                );

                await adapter.deleteCalendarEvent(1, 'evt-1');

                expect(integrationRepository.save).not.toHaveBeenCalled();
            });
        });
    });
});
