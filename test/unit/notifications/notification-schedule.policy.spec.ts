import { describe, expect, it } from '@jest/globals';
import {
    assertExternalAfterInternal,
    assertInternalDate,
    ensureBusinessHour,
} from '@/modules/notifications/domain/services/notification-schedule.policy';
import { InvalidScheduleDateException } from '@/modules/notifications/domain/exceptions/invalid-schedule-date.exception';

describe('Notifications module', () => {
    describe('notification schedule policy', () => {
        describe('ensureBusinessHour', () => {
            it('keeps a time already within business hours', () => {
                const date = new Date(2026, 5, 10, 14, 30, 0);
                expect(ensureBusinessHour(date).getHours()).toBe(14);
            });

            it('moves an early time to 09:00', () => {
                const date = new Date(2026, 5, 10, 6, 0, 0);
                const adjusted = ensureBusinessHour(date);
                expect(adjusted.getHours()).toBe(9);
                expect(adjusted.getMinutes()).toBe(0);
            });

            it('moves a late time to 09:00', () => {
                const date = new Date(2026, 5, 10, 21, 0, 0);
                expect(ensureBusinessHour(date).getHours()).toBe(9);
            });
        });

        describe('assertInternalDate', () => {
            const now = new Date('2026-06-10T12:00:00.000Z');
            const fechaFin = new Date('2026-06-20T12:00:00.000Z');

            it('accepts a date after now and before activity end', () => {
                expect(() =>
                    assertInternalDate(
                        new Date('2026-06-12T12:00:00.000Z'),
                        fechaFin,
                        now,
                    ),
                ).not.toThrow();
            });

            it('rejects a date in the past', () => {
                expect(() =>
                    assertInternalDate(
                        new Date('2026-06-09T12:00:00.000Z'),
                        fechaFin,
                        now,
                    ),
                ).toThrow(InvalidScheduleDateException);
            });

            it('rejects a date after the activity end', () => {
                expect(() =>
                    assertInternalDate(
                        new Date('2026-06-21T12:00:00.000Z'),
                        fechaFin,
                        now,
                    ),
                ).toThrow(InvalidScheduleDateException);
            });
        });

        describe('assertExternalAfterInternal', () => {
            it('accepts external after internal', () => {
                expect(() =>
                    assertExternalAfterInternal(
                        new Date('2026-06-10T14:00:00.000Z'),
                        new Date('2026-06-10T16:00:00.000Z'),
                    ),
                ).not.toThrow();
            });

            it('rejects external equal or before internal', () => {
                expect(() =>
                    assertExternalAfterInternal(
                        new Date('2026-06-10T16:00:00.000Z'),
                        new Date('2026-06-10T16:00:00.000Z'),
                    ),
                ).toThrow(InvalidScheduleDateException);
            });
        });
    });
});
