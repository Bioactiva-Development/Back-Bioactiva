import { describe, expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import { IsAfterOrEqualDate } from '@/shared/infrastructure/validators/is-after-or-equal-date.validator';

/**
 * IsAfterOrEqualDate
 * ------------------
 * Valida que la fecha decorada sea >= a otro campo del DTO. Si falta alguno de
 * los valores o el formato no es parseable, no falla (lo reporta @IsDateString).
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

describe('IsAfterOrEqualDate validator', () => {
    it('passes when fechaHasta is after fechaDesde', async () => {
        const errors = await validate(
            buildDto('2026-01-01T00:00:00.000Z', '2026-12-31T00:00:00.000Z'),
        );
        expect(errors).toHaveLength(0);
    });

    it('passes when both dates are equal', async () => {
        const errors = await validate(
            buildDto('2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
        );
        expect(errors).toHaveLength(0);
    });

    it('fails when fechaHasta is before fechaDesde', async () => {
        const errors = await validate(
            buildDto('2026-12-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toHaveProperty('isAfterOrEqualDate');
    });

    it('passes when fechaDesde is absent', async () => {
        const errors = await validate(
            buildDto(undefined, '2026-01-01T00:00:00.000Z'),
        );
        expect(errors).toHaveLength(0);
    });

    it('passes when both are absent', async () => {
        const errors = await validate(buildDto(undefined, undefined));
        expect(errors).toHaveLength(0);
    });
});
