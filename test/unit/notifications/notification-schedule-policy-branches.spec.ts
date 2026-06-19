import { describe, expect, it } from '@jest/globals';
import {
    computeReminderSendAt,
    assertExternalDate,
    assertInstanceCount,
    assertInstancesChained,
    MIN_REMINDER_MINUTES,
    MAX_REMINDER_MINUTES,
} from '@/modules/notifications/domain/services/notification-schedule.policy';
import { InvalidScheduleDateException } from '@/modules/notifications/domain/exceptions/invalid-schedule-date.exception';

describe('Notifications module', () => {
    describe('notification schedule policy — branches', () => {
        describe('computeReminderSendAt', () => {
            const now = new Date('2026-06-10T12:00:00.000Z');
            const fechaFin = new Date('2026-06-10T15:00:00.000Z');

            it('returns fechaFin - minutosAntes when valid', () => {
                const sendAt = computeReminderSendAt(fechaFin, 30, now);
                expect(sendAt).toEqual(
                    new Date('2026-06-10T14:30:00.000Z'),
                );
            });

            it('accepts the minimum and maximum bounds', () => {
                expect(() =>
                    computeReminderSendAt(fechaFin, MIN_REMINDER_MINUTES, now),
                ).not.toThrow();
                expect(() =>
                    computeReminderSendAt(fechaFin, MAX_REMINDER_MINUTES, now),
                ).not.toThrow();
            });

            it('rejects a non-integer number of minutes', () => {
                expect(() =>
                    computeReminderSendAt(fechaFin, 30.5, now),
                ).toThrow(InvalidScheduleDateException);
            });

            it('rejects fewer than the minimum minutes', () => {
                expect(() =>
                    computeReminderSendAt(
                        fechaFin,
                        MIN_REMINDER_MINUTES - 1,
                        now,
                    ),
                ).toThrow(InvalidScheduleDateException);
            });

            it('rejects more than the maximum minutes', () => {
                expect(() =>
                    computeReminderSendAt(
                        fechaFin,
                        MAX_REMINDER_MINUTES + 1,
                        now,
                    ),
                ).toThrow(InvalidScheduleDateException);
            });

            it('rejects when the resulting send date is in the past', () => {
                // fechaFin only 10 minutes after now, but we ask for 120 before.
                const closeFin = new Date('2026-06-10T12:10:00.000Z');
                expect(() =>
                    computeReminderSendAt(closeFin, 120, now),
                ).toThrow(InvalidScheduleDateException);
            });
        });

        describe('assertExternalDate', () => {
            const now = new Date('2026-06-10T12:00:00.000Z');
            const fechaFin = new Date('2026-06-20T12:00:00.000Z');

            it('accepts a date after now and before activity end', () => {
                expect(() =>
                    assertExternalDate(
                        new Date('2026-06-15T12:00:00.000Z'),
                        fechaFin,
                        now,
                    ),
                ).not.toThrow();
            });

            it('rejects a date in the past', () => {
                expect(() =>
                    assertExternalDate(
                        new Date('2026-06-09T12:00:00.000Z'),
                        fechaFin,
                        now,
                    ),
                ).toThrow(InvalidScheduleDateException);
            });

            it('rejects a date at or after the activity end', () => {
                expect(() =>
                    assertExternalDate(
                        new Date('2026-06-20T12:00:00.000Z'),
                        fechaFin,
                        now,
                    ),
                ).toThrow(InvalidScheduleDateException);
            });
        });

        describe('assertInstanceCount', () => {
            it('accepts exactly one instance', () => {
                expect(() => assertInstanceCount(1)).not.toThrow();
            });

            it('rejects zero instances', () => {
                expect(() => assertInstanceCount(0)).toThrow(
                    InvalidScheduleDateException,
                );
            });

            it('rejects more than one instance', () => {
                expect(() => assertInstanceCount(2)).toThrow(
                    InvalidScheduleDateException,
                );
            });
        });

        describe('assertInstancesChained', () => {
            it('accepts a current internal after the previous external', () => {
                expect(() =>
                    assertInstancesChained(
                        new Date('2026-06-10T10:00:00.000Z'),
                        new Date('2026-06-10T11:00:00.000Z'),
                    ),
                ).not.toThrow();
            });

            it('rejects a current internal at or before the previous external', () => {
                expect(() =>
                    assertInstancesChained(
                        new Date('2026-06-10T11:00:00.000Z'),
                        new Date('2026-06-10T11:00:00.000Z'),
                    ),
                ).toThrow(InvalidScheduleDateException);
            });
        });
    });
});
