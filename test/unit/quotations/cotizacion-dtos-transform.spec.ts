import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListCotizacionesQueryDto } from '@/modules/quotations/infrastructure/http/dto/list-cotizaciones-query.dto.http';
import { HttpCreateCotizacionDto } from '@/modules/quotations/infrastructure/http/dto/create-cotizacion.dto.http';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

describe('Quotations module', () => {
    describe('ListCotizacionesQueryDto (@Type transforms + validation)', () => {
        it('coerces numeric query strings into numbers and validates', async () => {
            const dto = plainToInstance(ListCotizacionesQueryDto, {
                idLead: '5',
                idRemitente: '7',
                page: '2',
                limit: '20',
                estado: EstadoCot.PENDIENTE,
                tipo: TipoMoneda.USD,
            });

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.idLead).toBe(5);
            expect(dto.idRemitente).toBe(7);
            expect(dto.page).toBe(2);
            expect(dto.limit).toBe(20);
        });

        it('applies the page/limit defaults when omitted', () => {
            const dto = plainToInstance(ListCotizacionesQueryDto, {});

            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });

        it('rejects a non-integer idLead', async () => {
            const dto = plainToInstance(ListCotizacionesQueryDto, {
                idLead: 'abc',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'idLead')).toBe(true);
        });

        it('rejects idRemitente below the minimum', async () => {
            const dto = plainToInstance(ListCotizacionesQueryDto, {
                idRemitente: '0',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'idRemitente')).toBe(true);
        });

        it('rejects an invalid estado enum value', async () => {
            const dto = plainToInstance(ListCotizacionesQueryDto, {
                estado: 'NOPE',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'estado')).toBe(true);
        });

        it('rejects when fechaHasta is before fechaDesde', async () => {
            const dto = plainToInstance(ListCotizacionesQueryDto, {
                fechaDesde: '2026-12-01',
                fechaHasta: '2026-01-01',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'fechaHasta')).toBe(true);
        });

        it('accepts fechaHasta after or equal to fechaDesde', async () => {
            const dto = plainToInstance(ListCotizacionesQueryDto, {
                fechaDesde: '2026-01-01',
                fechaHasta: '2026-12-01',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'fechaHasta')).toBe(false);
        });
    });

    describe('HttpCreateCotizacionDto (@Type transforms + validation)', () => {
        const validPayload = () => ({
            fechaCot: '2026-06-01T10:00:00.000Z',
            dirigido: 'Dr. Martinez',
            nombreServicio: 'Desarrollo Customizado',
            monto: '5000.00',
            tipo: TipoMoneda.USD,
            idLead: '1',
            idRemitente: '2',
        });

        it('coerces idLead/idRemitente strings into numbers and validates', async () => {
            const dto = plainToInstance(HttpCreateCotizacionDto, validPayload());

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
            expect(dto.idLead).toBe(1);
            expect(dto.idRemitente).toBe(2);
        });

        it('rejects idLead below the minimum', async () => {
            const dto = plainToInstance(HttpCreateCotizacionDto, {
                ...validPayload(),
                idLead: '0',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'idLead')).toBe(true);
        });

        it('rejects a non-integer idRemitente', async () => {
            const dto = plainToInstance(HttpCreateCotizacionDto, {
                ...validPayload(),
                idRemitente: 'x',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'idRemitente')).toBe(true);
        });

        it('rejects a non-numeric monto', async () => {
            const dto = plainToInstance(HttpCreateCotizacionDto, {
                ...validPayload(),
                monto: 'not-a-number',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'monto')).toBe(true);
        });

        it('rejects an invalid tipo enum value', async () => {
            const dto = plainToInstance(HttpCreateCotizacionDto, {
                ...validPayload(),
                tipo: 'BTC',
            });

            const errors = await validate(dto);

            expect(errors.some((e) => e.property === 'tipo')).toBe(true);
        });
    });
});
