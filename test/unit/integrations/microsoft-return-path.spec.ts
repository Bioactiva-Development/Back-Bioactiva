import { describe, expect, it } from '@jest/globals';
import {
    DEFAULT_RETURN_PATH,
    sanitizeReturnPath,
} from '@/modules/integrations/application/microsoft-return-path';

/**
 * sanitizeReturnPath
 * ------------------
 * Sanea la ruta de retorno tras el OAuth de Microsoft para evitar open-redirects.
 */
describe('Integrations module', () => {
    describe('sanitizeReturnPath', () => {
        it('returns the default path when input is undefined/null/empty', () => {
            expect(sanitizeReturnPath()).toBe(DEFAULT_RETURN_PATH);
            expect(sanitizeReturnPath(null)).toBe(DEFAULT_RETURN_PATH);
            expect(sanitizeReturnPath('')).toBe(DEFAULT_RETURN_PATH);
        });

        it('returns the default path when input does not start with "/"', () => {
            expect(sanitizeReturnPath('ajustes')).toBe(DEFAULT_RETURN_PATH);
        });

        it('returns the default path for protocol-relative paths ("//")', () => {
            expect(sanitizeReturnPath('//evil.com')).toBe(DEFAULT_RETURN_PATH);
        });

        it('returns the default path when input contains a scheme separator', () => {
            expect(sanitizeReturnPath('/path:javascript')).toBe(
                DEFAULT_RETURN_PATH,
            );
        });

        it('returns the default path when input contains a backslash', () => {
            expect(sanitizeReturnPath('/path\\windows')).toBe(
                DEFAULT_RETURN_PATH,
            );
        });

        it('returns the input when it is a valid internal path', () => {
            expect(sanitizeReturnPath('/notificaciones')).toBe(
                '/notificaciones',
            );
        });
    });
});
