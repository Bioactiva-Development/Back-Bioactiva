import { describe, expect, it } from '@jest/globals';
import { maskEmail } from '@/shared/domain/utils/mask-email';

describe('maskEmail', () => {
    it('should keep the first and last char of the local part for long locals', () => {
        expect(maskEmail('john.doe@bioactiva.com')).toMatch(
            /^j\*+e@bioactiva\.com$/,
        );
    });

    it('should mask a 2-char local part leaving only the first char', () => {
        expect(maskEmail('ab@bioactiva.com')).toBe('a*@bioactiva.com');
    });

    it('should leave a single-char local part untouched', () => {
        expect(maskEmail('a@bioactiva.com')).toBe('a@bioactiva.com');
    });

    it('should preserve the domain unchanged', () => {
        expect(maskEmail('someone@sub.example.org').split('@')[1]).toBe(
            'sub.example.org',
        );
    });
});
