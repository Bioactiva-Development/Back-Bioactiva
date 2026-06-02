import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MicrosoftCalendarSyncAdapter } from '@/modules/integrations/infrastructure/sync/microsoft-calendar-sync.adapter';
import { MicrosoftGraphRequestException } from '@/modules/integrations/domain/exceptions/microsoft-graph-request.exception';

/**
 * MicrosoftCalendarSyncAdapter
 * ----------------------------
 * Adaptador que implementa CalendarSyncPort sobre Microsoft Graph:
 * - isUserConnected refleja el estado de la integración.
 * - Las operaciones resuelven un access token fresco vía refreshAccessToken.
 * - Si el usuario no está conectado, lanza MicrosoftGraphRequestException.
 * - Persiste la rotación del refresh token cuando Microsoft devuelve uno nuevo.
 */
describe('Integrations module', () => {
    describe('MicrosoftCalendarSyncAdapter', () => {
        let adapter: MicrosoftCalendarSyncAdapter;
        let integrationRepository: any;
        let microsoftProvider: any;

        const connectedIntegration = () => ({
            conectado: true,
            refreshToken: 'refresh-old',
            tokenExpiresAt: null as Date | null,
            updatedAt: new Date(),
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

        describe('isUserConnected', () => {
            it('returns true when connected with a refresh token', async () => {
                integrationRepository.findByUserId.mockResolvedValue(
                    connectedIntegration(),
                );
                await expect(adapter.isUserConnected(1)).resolves.toBe(true);
            });

            it('returns false when there is no integration', async () => {
                integrationRepository.findByUserId.mockResolvedValue(null);
                await expect(adapter.isUserConnected(1)).resolves.toBe(false);
            });

            it('returns false when disconnected', async () => {
                integrationRepository.findByUserId.mockResolvedValue({
                    conectado: false,
                    refreshToken: 'x',
                });
                await expect(adapter.isUserConnected(1)).resolves.toBe(false);
            });
        });

        describe('createCalendarEvent', () => {
            it('resolves a fresh token and maps the provider result', async () => {
                integrationRepository.findByUserId.mockResolvedValue(
                    connectedIntegration(),
                );
                microsoftProvider.refreshAccessToken.mockResolvedValue({
                    accessToken: 'access-1',
                    refreshToken: 'refresh-old',
                });
                microsoftProvider.createCalendarEvent.mockResolvedValue({
                    id: 'evt-1',
                    joinUrl: null,
                });

                const result = await adapter.createCalendarEvent(1, eventInput);

                expect(result).toEqual({
                    outlookEventId: 'evt-1',
                    teamsJoinUrl: null,
                });
                expect(
                    microsoftProvider.createCalendarEvent,
                ).toHaveBeenCalledWith('access-1', eventInput, undefined);
            });

            it('returns the Teams join URL for an online meeting', async () => {
                integrationRepository.findByUserId.mockResolvedValue(
                    connectedIntegration(),
                );
                microsoftProvider.refreshAccessToken.mockResolvedValue({
                    accessToken: 'access-1',
                    refreshToken: 'refresh-old',
                });
                microsoftProvider.createCalendarEvent.mockResolvedValue({
                    id: 'evt-1',
                    joinUrl: 'https://teams/join',
                });

                const result = await adapter.createCalendarEvent(1, eventInput, {
                    onlineMeeting: true,
                });

                expect(result.teamsJoinUrl).toBe('https://teams/join');
                expect(
                    microsoftProvider.createCalendarEvent,
                ).toHaveBeenCalledWith('access-1', eventInput, {
                    onlineMeeting: true,
                });
            });

            it('persists the rotated refresh token when Microsoft returns a new one', async () => {
                const integration = connectedIntegration();
                integrationRepository.findByUserId.mockResolvedValue(
                    integration,
                );
                microsoftProvider.refreshAccessToken.mockResolvedValue({
                    accessToken: 'access-1',
                    refreshToken: 'refresh-new',
                    expiresIn: 3600,
                });
                microsoftProvider.createCalendarEvent.mockResolvedValue({
                    id: 'evt-1',
                    joinUrl: null,
                });

                await adapter.createCalendarEvent(1, eventInput);

                expect(integration.refreshToken).toBe('refresh-new');
                expect(integrationRepository.save).toHaveBeenCalledWith(
                    integration,
                );
            });

            it('throws MicrosoftGraphRequestException when user is not connected', async () => {
                integrationRepository.findByUserId.mockResolvedValue(null);

                await expect(
                    adapter.createCalendarEvent(1, eventInput),
                ).rejects.toThrow(MicrosoftGraphRequestException);
                expect(
                    microsoftProvider.createCalendarEvent,
                ).not.toHaveBeenCalled();
            });
        });
    });
});
