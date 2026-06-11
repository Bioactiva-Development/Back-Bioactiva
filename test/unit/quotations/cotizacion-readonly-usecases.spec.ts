import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetCotizacionByIdUseCase } from '@/modules/quotations/application/use-cases/get-cotizacion-by-id.use-case';
import { ListCotizacionesUseCase } from '@/modules/quotations/application/use-cases/list-cotizaciones.use-case';
import { ListCotizacionesDto } from '@/modules/quotations/application/dto/list-cotizaciones.dto';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';

describe('Quotations module', () => {
    describe('GetCotizacionByIdUseCase', () => {
        let useCase: GetCotizacionByIdUseCase;
        let repository: any;

        beforeEach(() => {
            repository = { findByIdWithRelations: jest.fn() };
            useCase = new GetCotizacionByIdUseCase(repository);
        });

        it('returns the enriched cotizacion when found', async () => {
            const enriched = { cotizacion: { id: 1 } };
            repository.findByIdWithRelations.mockResolvedValue(enriched);

            const result = await useCase.execute(1);

            expect(result).toBe(enriched);
            expect(repository.findByIdWithRelations).toHaveBeenCalledWith(1);
        });

        it('throws CotizacionNotFoundException when missing', async () => {
            repository.findByIdWithRelations.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toBeInstanceOf(
                CotizacionNotFoundException,
            );
        });
    });

    describe('ListCotizacionesUseCase', () => {
        let useCase: ListCotizacionesUseCase;
        let repository: any;

        beforeEach(() => {
            repository = { list: jest.fn(), count: jest.fn() };
            useCase = new ListCotizacionesUseCase(repository);
        });

        it('returns data and total, passing filters to list and count', async () => {
            repository.list.mockResolvedValue([{ cotizacion: { id: 1 } }]);
            repository.count.mockResolvedValue(1);

            const dto = new ListCotizacionesDto(
                10,
                'PENDIENTE',
                7,
                undefined,
                undefined,
                1,
                10,
            );
            const result = await useCase.execute(dto);

            expect(result).toEqual({
                data: [{ cotizacion: { id: 1 } }],
                total: 1,
            });
            expect(repository.list).toHaveBeenCalledWith({
                idLead: 10,
                estado: 'PENDIENTE',
                idRemitente: 7,
                page: 1,
                limit: 10,
            });
            expect(repository.count).toHaveBeenCalledWith({
                idLead: 10,
                estado: 'PENDIENTE',
                idRemitente: 7,
            });
        });
    });
});
