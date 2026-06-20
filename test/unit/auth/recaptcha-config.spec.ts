import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { RecaptchaConfig } from '@/modules/auth/infrastructure/config/recaptcha.config';

/**
 * RecaptchaConfig
 * ---------------
 * Lee la configuración de reCAPTCHA desde ConfigService, con defaults para las
 * claves opcionales y getOrThrow para projectId/siteKey.
 */
describe('Auth module', () => {
    describe('RecaptchaConfig', () => {
        let configService: jest.Mocked<ConfigService>;
        let config: RecaptchaConfig;

        beforeEach(() => {
            configService = {
                get: jest.fn(),
                getOrThrow: jest.fn(),
            } as unknown as jest.Mocked<ConfigService>;
            config = new RecaptchaConfig(configService);
        });

        it('enabled is true only when RECAPTCHA_ENABLED is "true"', () => {
            configService.get.mockReturnValue('true');
            expect(config.enabled).toBe(true);
        });

        it('enabled is false otherwise', () => {
            configService.get.mockReturnValue('false');
            expect(config.enabled).toBe(false);
        });

        it('mode returns "score" when configured as score', () => {
            configService.get.mockReturnValue('score');
            expect(config.mode).toBe('score');
        });

        it('mode falls back to "checkbox"', () => {
            configService.get.mockReturnValue('checkbox');
            expect(config.mode).toBe('checkbox');
        });

        it('projectId comes from getOrThrow(GOOGLE_CLOUD_PROJECT_ID)', () => {
            configService.getOrThrow.mockReturnValue('project-1');
            expect(config.projectId).toBe('project-1');
            expect(configService.getOrThrow).toHaveBeenCalledWith(
                'GOOGLE_CLOUD_PROJECT_ID',
            );
        });

        it('siteKey comes from getOrThrow(RECAPTCHA_SITE_KEY)', () => {
            configService.getOrThrow.mockReturnValue('site-key');
            expect(config.siteKey).toBe('site-key');
            expect(configService.getOrThrow).toHaveBeenCalledWith(
                'RECAPTCHA_SITE_KEY',
            );
        });

        it('minScore parses the configured number', () => {
            configService.get.mockReturnValue('0.7');
            expect(config.minScore).toBe(0.7);
        });

        it('loginAction comes from ConfigService.get with default', () => {
            configService.get.mockReturnValue('login');
            expect(config.loginAction).toBe('login');
            expect(configService.get).toHaveBeenCalledWith(
                'RECAPTCHA_LOGIN_ACTION',
                'login',
            );
        });
    });
});
