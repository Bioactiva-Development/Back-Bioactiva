import { describe, expect, it } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import {
    AppTimeConfig,
    DEFAULT_APP_TIMEZONE,
} from '@/shared/infrastructure/config/app-time.config';

function configWith(value?: string): ConfigService {
    return {
        get: (_key: string, defaultValue?: string) => value ?? defaultValue,
    } as unknown as ConfigService;
}

describe('AppTimeConfig', () => {
    it('defaults to America/Lima when APP_TIMEZONE is not set', () => {
        const config = new AppTimeConfig(configWith(undefined));
        expect(config.timeZone).toBe(DEFAULT_APP_TIMEZONE);
        expect(config.timeZone).toBe('America/Lima');
    });

    it('uses a valid IANA timezone from the env', () => {
        const config = new AppTimeConfig(configWith('America/New_York'));
        expect(config.timeZone).toBe('America/New_York');
    });

    it('throws on an invalid timezone (e.g. "America/Latina")', () => {
        expect(() => new AppTimeConfig(configWith('America/Latina'))).toThrow(
            /APP_TIMEZONE inválida/,
        );
    });

    it('throws on an empty timezone', () => {
        expect(() => new AppTimeConfig(configWith(''))).toThrow(
            /APP_TIMEZONE inválida/,
        );
    });
});
