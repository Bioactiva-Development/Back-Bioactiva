import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { MicrosoftAuthConfig } from '@/modules/integrations/infrastructure/config/microsoft-auth.config';

/**
 * MicrosoftAuthConfig
 * -------------------
 * Expone la configuración de Azure/Microsoft a partir de ConfigService.
 * Las claves obligatorias usan getOrThrow; las opcionales tienen default.
 */
describe('Integrations module', () => {
    describe('MicrosoftAuthConfig', () => {
        let configService: jest.Mocked<ConfigService>;
        let config: MicrosoftAuthConfig;

        beforeEach(() => {
            configService = {
                get: jest.fn(),
                getOrThrow: jest.fn(),
            } as unknown as jest.Mocked<ConfigService>;
            config = new MicrosoftAuthConfig(configService);
        });

        it('returns clientId from getOrThrow(AZURE_CLIENT_ID)', () => {
            configService.getOrThrow.mockReturnValue('client-id');
            expect(config.clientId).toBe('client-id');
            expect(configService.getOrThrow).toHaveBeenCalledWith(
                'AZURE_CLIENT_ID',
            );
        });

        it('returns clientSecret from getOrThrow(AZURE_CLIENT_SECRET)', () => {
            configService.getOrThrow.mockReturnValue('secret');
            expect(config.clientSecret).toBe('secret');
            expect(configService.getOrThrow).toHaveBeenCalledWith(
                'AZURE_CLIENT_SECRET',
            );
        });

        it('returns tenantId from getOrThrow(AZURE_TENANT_ID)', () => {
            configService.getOrThrow.mockReturnValue('tenant-1');
            expect(config.tenantId).toBe('tenant-1');
            expect(configService.getOrThrow).toHaveBeenCalledWith(
                'AZURE_TENANT_ID',
            );
        });

        it('propagates the throw when a required env is missing', () => {
            configService.getOrThrow.mockImplementation(() => {
                throw new Error('missing');
            });
            expect(() => config.clientId).toThrow('missing');
        });

        it('returns redirectUri from ConfigService.get with default', () => {
            configService.get.mockReturnValue('https://app/callback');
            expect(config.redirectUri).toBe('https://app/callback');
            expect(configService.get).toHaveBeenCalledWith(
                'MICROSOFT_REDIRECT_URI',
                'http://localhost:3000/microsoft/callback',
            );
        });

        it('splits scopes into an array and filters empties', () => {
            configService.get.mockReturnValue('openid  profile email');
            expect(config.scopes).toEqual(['openid', 'profile', 'email']);
        });

        it('builds the authority from the tenantId', () => {
            configService.getOrThrow.mockReturnValue('tenant-xyz');
            expect(config.authority).toBe(
                'https://login.microsoftonline.com/tenant-xyz',
            );
        });
    });
});
