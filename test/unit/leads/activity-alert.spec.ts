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

        it('returns LIBRE when there are no pending activities', () => {
            expect(computeActivityAlert([], now)).toBe(ActivityAlertLevel.LIBRE);
        });

        it('returns POR_VENCER when a pending activity is overdue', () => {
            expect(
                computeActivityAlert(
                    [{ createdAt: days(-10), fechaFin: days(-1) }],
                    now,
                ),
            ).toBe(ActivityAlertLevel.POR_VENCER);
        });

        it('returns POR_VENCER when a pending activity is due within the threshold', () => {
            expect(
                computeActivityAlert(
                    [
                        {
                            createdAt: days(-1),
                            fechaFin: days(ACTIVITY_ALERT_DUE_SOON_DAYS - 1),
                        },
                    ],
                    now,
                ),
            ).toBe(ActivityAlertLevel.POR_VENCER);
        });

        it('includes the threshold boundary as POR_VENCER', () => {
            expect(
                computeActivityAlert(
                    [
                        {
                            createdAt: days(-1),
                            fechaFin: days(ACTIVITY_ALERT_DUE_SOON_DAYS),
                        },
                    ],
                    now,
                ),
            ).toBe(ActivityAlertLevel.POR_VENCER);
        });

        it('returns CRITICO when a pending activity passed its midpoint but is not due soon', () => {
            // createdAt hace 10 días, vence en 6 días: punto medio hace 2 días.
            expect(
                computeActivityAlert(
                    [{ createdAt: days(-10), fechaFin: days(6) }],
                    now,
                ),
            ).toBe(ActivityAlertLevel.CRITICO);
        });

        it('returns PENDIENTE when a pending activity is before its midpoint and not due soon', () => {
            // createdAt ayer, vence en 20 días: punto medio dentro de ~9 días.
            expect(
                computeActivityAlert(
                    [{ createdAt: days(-1), fechaFin: days(20) }],
                    now,
                ),
            ).toBe(ActivityAlertLevel.PENDIENTE);
        });

        it('prioritizes POR_VENCER over CRITICO', () => {
            expect(
                computeActivityAlert(
                    [
                        { createdAt: days(-10), fechaFin: days(6) }, // crítico
                        { createdAt: days(-1), fechaFin: days(2) }, // por vencer
                    ],
                    now,
                ),
            ).toBe(ActivityAlertLevel.POR_VENCER);
        });

        it('prioritizes CRITICO over PENDIENTE', () => {
            expect(
                computeActivityAlert(
                    [
                        { createdAt: days(-1), fechaFin: days(20) }, // pendiente
                        { createdAt: days(-10), fechaFin: days(6) }, // crítico
                    ],
                    now,
                ),
            ).toBe(ActivityAlertLevel.CRITICO);
        });
    });
});
