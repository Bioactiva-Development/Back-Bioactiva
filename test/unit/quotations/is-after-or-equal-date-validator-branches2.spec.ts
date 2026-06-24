import { describe, expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import { IsAfterOrEqualDate } from '@/shared/infrastructure/validators/is-after-or-equal-date.validator';

/**
 * Branch coverage extra para
 * `if (Number.isNaN(current) || Number.isNaN(other))`: con fechas no parseables,
 * getTime() es NaN y el validador NO falla (deja el formato a @IsDateString).
 */
class RangeDto {
    fechaDesde?: string;

    @IsAfterOrEqualDate('fechaDesde')
    fechaHasta?: string;
}

const buildDto = (fechaDesde?: string, fechaHasta?: string): RangeDto => {
    const dto = new RangeDto();
    dto.fechaDesde = fechaDesde;
    dto.fechaHasta = fechaHasta;
    return dto;
};

describe('IsAfterOrEqualDate validator — branches2', () => {
    it('passes when the decorated value is not a parseable date (NaN current)', async () => {
        const errors = await validate(
            buildDto('2026-01-01T00:00:00.000Z', 'no-es-fecha'),
        );
        expect(errors).toHaveLength(0);
    });

    it('passes when the related value is not a parseable date (NaN other)', async () => {
        const errors = await validate(
            buildDto('tampoco-es-fecha', '2026-01-01T00:00:00.000Z'),
        );
        expect(errors).toHaveLength(0);
    });
});
