import { describe, expect, it } from '@jest/globals';
import { MicrosoftIntegration } from '@/modules/integrations/domain/entities/microsoft-integration';

describe('Integrations module', () => {
    describe('MicrosoftIntegration entity', () => {
        const baseDate = new Date('2024-01-01T00:00:00.000Z');

        const buildIntegration = () =>
            new MicrosoftIntegration(
                1,
                5,
                'user@example.com',
                'oid-123',
                null,
                null,
                false,
                baseDate,
                baseDate,
            );

        it('should mark account as connected with new tokens', () => {
            const integration = buildIntegration();
            const expiresAt = new Date('2025-01-01T00:00:00.000Z');

            integration.markAsConnected(
                'new@example.com',
                'new-oid',
                'refresh-token',
                expiresAt,
            );

            expect(integration.microsoftEmail).toBe('new@example.com');
            expect(integration.microsoftOid).toBe('new-oid');
            expect(integration.refreshToken).toBe('refresh-token');
            expect(integration.tokenExpiresAt).toBe(expiresAt);
            expect(integration.conectado).toBe(true);
            expect(integration.updatedAt.getTime()).toBeGreaterThan(
                integration.createdAt.getTime(),
            );
        });

        it('should disconnect account and clear tokens', () => {
            const integration = buildIntegration();
            integration.conectado = true;
            integration.refreshToken = 'some-token';
            integration.tokenExpiresAt = new Date('2025-01-01T00:00:00.000Z');

            integration.disconnect();

            expect(integration.conectado).toBe(false);
            expect(integration.refreshToken).toBeNull();
            expect(integration.tokenExpiresAt).toBeNull();
        });

        it('should preserve user id during operations', () => {
            const integration = buildIntegration();
            const originalUserId = integration.idUsuario;

            integration.markAsConnected('a@b.com', 'oid-456', 'rt', new Date());
            expect(integration.idUsuario).toBe(originalUserId);

            integration.disconnect();
            expect(integration.idUsuario).toBe(originalUserId);
        });
    });
});
