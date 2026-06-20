import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateCotizacionUseCase } from '@/modules/quotations/application/use-cases/update-cotizacion.use-case';
import { UpdateCotizacionDto } from '@/modules/quotations/application/dto/update-cotizacion.dto';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
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
        'observacion previa',
        'https://old.link',
        10,
        7,
        3,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-01T00:00:00.000Z'),
        null,
    );

describe('Quotations module', () => {
    describe('UpdateCotizacionUseCase (optional field branches)', () => {
        let useCase: UpdateCotizacionUseCase;
        let repository: any;

        beforeEach(() => {
            repository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            useCase = new UpdateCotizacionUseCase(repository);
        });

        it('applies every optional field (fechaCot, dirigido, cliente, producto, tipo, observacion, linkPropuesta)', async () => {
            const cotizacion = buildCotizacion(EstadoCot.PENDIENTE);
            repository.findById.mockResolvedValue(cotizacion);
            repository.saveWithRelations.mockImplementation(async (c: any) => ({
                cotizacion: c,
            }));

            const nuevaFecha = new Date('2026-07-15T00:00:00.000Z');
            const dto = new UpdateCotizacionDto(
                nuevaFecha,
                'Dra. Lopez',
                'NuevoCliente SA',
                'Producto Nuevo',
                'Servicio Editado',
                '7500.00',
                TipoMoneda.PEN,
                'nueva observacion',
                'https://new.link',
            );

            await useCase.execute(1, dto);

            expect(cotizacion.fecha_cot).toBe(nuevaFecha);
            expect(cotizacion.dirigido).toBe('Dra. Lopez');
            expect(cotizacion.cliente).toBe('NuevoCliente SA');
            expect(cotizacion.producto).toBe('Producto Nuevo');
            expect(cotizacion.nombre_servicio).toBe('Servicio Editado');
            expect(cotizacion.monto).toBe('7500.00');
            expect(cotizacion.tipo).toBe(TipoMoneda.PEN);
            expect(cotizacion.observacion).toBe('nueva observacion');
            expect(cotizacion.link_propuesta).toBe('https://new.link');
            expect(repository.saveWithRelations).toHaveBeenCalledWith(
                cotizacion,
            );
        });

        it('allows setting nullable fields explicitly to null', async () => {
            const cotizacion = buildCotizacion(EstadoCot.PENDIENTE);
            repository.findById.mockResolvedValue(cotizacion);
            repository.saveWithRelations.mockImplementation(async (c: any) => ({
                cotizacion: c,
            }));

            const dto = new UpdateCotizacionDto(
                undefined,
                undefined,
                null,
                null,
                undefined,
                undefined,
                undefined,
                null,
                null,
            );

            await useCase.execute(1, dto);

            expect(cotizacion.cliente).toBeNull();
            expect(cotizacion.producto).toBeNull();
            expect(cotizacion.observacion).toBeNull();
            expect(cotizacion.link_propuesta).toBeNull();
        });

        it('refreshes updated_at and persists when nothing changes', async () => {
            const cotizacion = buildCotizacion(EstadoCot.ENVIADA);
            const previousUpdatedAt = cotizacion.updated_at;
            repository.findById.mockResolvedValue(cotizacion);
            repository.saveWithRelations.mockResolvedValue({ cotizacion });

            await useCase.execute(1, new UpdateCotizacionDto());

            expect(cotizacion.updated_at.getTime()).toBeGreaterThanOrEqual(
                previousUpdatedAt.getTime(),
            );
            expect(repository.saveWithRelations).toHaveBeenCalledWith(
                cotizacion,
            );
        });

        it('rejects updating a RECHAZADA cotizacion', async () => {
            repository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.RECHAZADA),
            );

            await expect(
                useCase.execute(1, new UpdateCotizacionDto()),
            ).rejects.toBeInstanceOf(InvalidCotizacionTransitionException);
            expect(repository.saveWithRelations).not.toHaveBeenCalled();
        });
    });
});
