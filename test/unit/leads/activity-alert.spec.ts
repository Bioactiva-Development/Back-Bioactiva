import { describe, expect, it } from '@jest/globals';
import {
    computeActivityAlert,
    ACTIVITY_ALERT_YELLOW_DAYS,
} from '@/modules/leads/domain/services/activity-alert';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

describe('Leads module', () => {
    describe('computeActivityAlert', () => {
        const now = new Date('2026-06-11T12:00:00.000Z');
        const days = (n: number) =>
            new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

        it('returns VERDE when there are no pending activities', () => {
            expect(computeActivityAlert([], now)).toBe(ActivityAlertLevel.VERDE);
        });

        it('returns ROJO when any pending activity is overdue', () => {
            expect(computeActivityAlert([days(-1)], now)).toBe(
                ActivityAlertLevel.ROJO,
            );
        });

        it('prioritizes ROJO over AMARILLO when both overdue and upcoming exist', () => {
            expect(computeActivityAlert([days(-2), days(1)], now)).toBe(
                ActivityAlertLevel.ROJO,
            );
        });

        it('returns AMARILLO when a pending activity is due within the threshold', () => {
            expect(
                computeActivityAlert([days(ACTIVITY_ALERT_YELLOW_DAYS - 1)], now),
            ).toBe(ActivityAlertLevel.AMARILLO);
        });

        it('includes the threshold boundary as AMARILLO', () => {
            expect(
                computeActivityAlert([days(ACTIVITY_ALERT_YELLOW_DAYS)], now),
            ).toBe(ActivityAlertLevel.AMARILLO);
        });

        it('returns VERDE when all pending activities are beyond the threshold', () => {
            expect(
                computeActivityAlert([days(ACTIVITY_ALERT_YELLOW_DAYS + 1)], now),
            ).toBe(ActivityAlertLevel.VERDE);
        });
    });
});
