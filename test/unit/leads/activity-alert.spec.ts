import { describe, expect, it } from '@jest/globals';
import {
    computeActivityAlert,
    ACTIVITY_ALERT_DUE_SOON_DAYS,
} from '@/modules/leads/domain/services/activity-alert';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

describe('Leads module', () => {
    describe('computeActivityAlert', () => {
        const now = new Date('2026-06-11T12:00:00.000Z');
        const days = (n: number) =>
            new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

        it('returns SIN_ACTIVIDADES when there are no pending activities', () => {
            expect(computeActivityAlert([], now)).toBe(ActivityAlertLevel.SIN_ACTIVIDADES);
        });

        it('returns POR_VENCER when a pending activity is overdue', () => {
            expect(
                computeActivityAlert(
                    [{ fechaFin: days(-1) }],
                    now,
                ),
            ).toBe(ActivityAlertLevel.POR_VENCER);
        });

        it('returns POR_VENCER when a pending activity is due within the threshold', () => {
            expect(
                computeActivityAlert(
                    [{ fechaFin: days(ACTIVITY_ALERT_DUE_SOON_DAYS - 1) }],
                    now,
                ),
            ).toBe(ActivityAlertLevel.POR_VENCER);
        });

        it('includes the threshold boundary as POR_VENCER', () => {
            expect(
                computeActivityAlert(
                    [{ fechaFin: days(ACTIVITY_ALERT_DUE_SOON_DAYS) }],
                    now,
                ),
            ).toBe(ActivityAlertLevel.POR_VENCER);
        });

        it('returns PENDIENTE when a pending activity is beyond the threshold', () => {
            expect(
                computeActivityAlert(
                    [{ fechaFin: days(ACTIVITY_ALERT_DUE_SOON_DAYS + 1) }],
                    now,
                ),
            ).toBe(ActivityAlertLevel.PENDIENTE);
        });

        it('returns PENDIENTE when a pending activity is far in the future', () => {
            expect(
                computeActivityAlert(
                    [{ fechaFin: days(20) }],
                    now,
                ),
            ).toBe(ActivityAlertLevel.PENDIENTE);
        });

        it('prioritizes POR_VENCER over PENDIENTE when mixed', () => {
            expect(
                computeActivityAlert(
                    [
                        { fechaFin: days(20) },  // pendiente
                        { fechaFin: days(1) },   // por vencer
                    ],
                    now,
                ),
            ).toBe(ActivityAlertLevel.POR_VENCER);
        });
    });
});
