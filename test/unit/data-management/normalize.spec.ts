import { describe, expect, it } from '@jest/globals';
import { normalizeCell } from '@/modules/data-management/domain/constants/normalize';

describe('Data management module', () => {
    describe('normalizeCell', () => {
        it('returns an empty string for null', () => {
            expect(normalizeCell(null)).toBe('');
        });

        it('returns an empty string for undefined', () => {
            expect(normalizeCell(undefined)).toBe('');
        });

        it('returns an empty string for a plain object (e.g. an Excel rich-text cell)', () => {
            expect(normalizeCell({ richText: [{ text: 'hola' }] })).toBe('');
        });

        it('stringifies a Date instance instead of blanking it out', () => {
            const date = new Date('2026-01-01T00:00:00.000Z');
            const result = normalizeCell(date);
            expect(result).not.toBe('');
            expect(result).toBe(result.toLowerCase());
        });

        it('trims, lowercases, strips accents and collapses extra whitespace', () => {
            expect(normalizeCell('  Ántonio   Pérez  ')).toBe('antonio perez');
        });

        it('strips a trailing dot (vocative abbreviations like "Sr.")', () => {
            expect(normalizeCell('Sr.')).toBe('sr');
        });

        it('coerces numbers and booleans via String()', () => {
            expect(normalizeCell(42)).toBe('42');
            expect(normalizeCell(true)).toBe('true');
        });
    });
});
