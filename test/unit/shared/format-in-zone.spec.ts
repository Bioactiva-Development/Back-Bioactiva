import { describe, expect, it } from '@jest/globals';
import { formatDateTimeInZone } from '@/shared/infrastructure/datetime/format-in-zone';

describe('formatDateTimeInZone', () => {
    const instant = new Date('2026-01-01T00:00:00.000Z');

    it('formats a UTC instant in America/Lima (UTC-5)', () => {
        // 00:00 UTC del 1 ene → 19:00 del 31 dic en Lima.
        expect(formatDateTimeInZone(instant, 'America/Lima')).toBe(
            '31/12/2025, 19:00',
        );
    });

    it('formats the same instant differently in another zone', () => {
        // 00:00 UTC → 01:00 en Madrid (UTC+1 en invierno).
        expect(formatDateTimeInZone(instant, 'Europe/Madrid')).toBe(
            '01/01/2026, 01:00',
        );
    });

    it('does not depend on the host process timezone', () => {
        const original = process.env.TZ;
        try {
            process.env.TZ = 'Asia/Tokyo';
            expect(formatDateTimeInZone(instant, 'America/Lima')).toBe(
                '31/12/2025, 19:00',
            );
        } finally {
            process.env.TZ = original;
        }
    });
});
