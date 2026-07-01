import { describe, expect, it } from '@jest/globals';
import { ListCotizacionesDto } from '@/modules/quotations/application/dto/list-cotizaciones.dto';

describe('Quotations module', () => {
    describe('ListCotizacionesDto', () => {
        it('defaults page to 1 and limit to 10 when omitted', () => {
            const dto = new ListCotizacionesDto();

            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });

        it('keeps the explicit page and limit when provided', () => {
            const dto = new ListCotizacionesDto(
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                3,
                25,
            );

            expect(dto.page).toBe(3);
            expect(dto.limit).toBe(25);
        });
    });
});
