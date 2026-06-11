import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateCotizacionUseCase } from '@/modules/quotations/application/use-cases/update-cotizacion.use-case';
import { DeleteCotizacionUseCase } from '@/modules/quotations/application/use-cases/delete-cotizacion.use-case';
import { SendCotizacionUseCase } from '@/modules/quotations/application/use-cases/send-cotizacion.use-case';
import { UpdateCotizacionDto } from '@/modules/quotations/application/dto/update-cotizacion.dto';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';
import { InvalidCotizacionTransitionException } from '@/modules/quotations/domain/exceptions/invalid-cotizacion-transition.exception';

const buildCotizacion = (estado: EstadoCot = EstadoCot.PENDIENTE) =>
    new Cotizacion(
        1,
        new Date('2026-06-01T00:00:00.000Z'),
        'Dr. Martinez',
        'TechCorp SA',
        'Licencia Pro',
        'Juan Perez',
        'Desarrollo',
        '5000.00',
        TipoMoneda.USD,
        estado,
        null,
        null,
        10,
        7,
        3,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-01T00:00:00.000Z'),
        null,
    );

describe('Quotations module', () => {
    describe('UpdateCotizacionUseCase', () => {
        let useCase: UpdateCotizacionUseCase;
        let repository: any;

        beforeEach(() => {
            repository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            useCase = new UpdateCotizacionUseCase(repository);
        });

        it('throws when the cotizacion does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(
                useCase.execute(1, new UpdateCotizacionDto()),
            ).rejects.toBeInstanceOf(CotizacionNotFoundException);
        });

        it('rejects updating an ACEPTADA cotizacion', async () => {
            repository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.ACEPTADA),
            );

            await expect(
                useCase.execute(1, new UpdateCotizacionDto()),
            ).rejects.toBeInstanceOf(InvalidCotizacionTransitionException);
            expect(repository.saveWithRelations).not.toHaveBeenCalled();
        });

        it('applies provided fields and persists', async () => {
            const cotizacion = buildCotizacion(EstadoCot.PENDIENTE);
            repository.findById.mockResolvedValue(cotizacion);
            repository.saveWithRelations.mockImplementation(async (c: any) => ({
                cotizacion: c,
            }));

            const dto = new UpdateCotizacionDto(
                undefined,
                undefined,
                undefined,
                undefined,
                'Nuevo servicio',
                '9000.00',
                undefined,
                undefined,
                undefined,
            );
            await useCase.execute(1, dto);

            expect(cotizacion.nombre_servicio).toBe('Nuevo servicio');
            expect(cotizacion.monto).toBe('9000.00');
            expect(repository.saveWithRelations).toHaveBeenCalledWith(cotizacion);
        });
    });

    describe('DeleteCotizacionUseCase', () => {
        let useCase: DeleteCotizacionUseCase;
        let repository: any;

        beforeEach(() => {
            repository = { findById: jest.fn(), save: jest.fn() };
            useCase = new DeleteCotizacionUseCase(repository);
        });

        it('throws when the cotizacion does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(useCase.execute(1)).rejects.toBeInstanceOf(
                CotizacionNotFoundException,
            );
        });

        it('soft-deletes and returns ok', async () => {
            const cotizacion = buildCotizacion();
            repository.findById.mockResolvedValue(cotizacion);
            repository.save.mockResolvedValue(cotizacion);

            const result = await useCase.execute(1);

            expect(cotizacion.deleted_at).not.toBeNull();
            expect(repository.save).toHaveBeenCalledWith(cotizacion);
            expect(result).toEqual({ ok: true });
        });
    });

    describe('SendCotizacionUseCase', () => {
        let useCase: SendCotizacionUseCase;
        let repository: any;

        beforeEach(() => {
            repository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            useCase = new SendCotizacionUseCase(repository);
        });

        it('throws when the cotizacion does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(useCase.execute(1)).rejects.toBeInstanceOf(
                CotizacionNotFoundException,
            );
        });

        it('transitions to ENVIADA and persists', async () => {
            const cotizacion = buildCotizacion(EstadoCot.PENDIENTE);
            repository.findById.mockResolvedValue(cotizacion);
            repository.saveWithRelations.mockImplementation(async (c: any) => ({
                cotizacion: c,
            }));

            await useCase.execute(1);

            expect(cotizacion.estado).toBe(EstadoCot.ENVIADA);
            expect(repository.saveWithRelations).toHaveBeenCalledWith(cotizacion);
        });
    });
});
