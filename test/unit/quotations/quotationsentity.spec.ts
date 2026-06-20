import { describe, expect, it } from '@jest/globals';

import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { InvalidCotizacionTransitionException } from '@/modules/quotations/domain/exceptions/invalid-cotizacion-transition.exception';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

describe('Cotizacion entity domain rules', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');

    const buildCotizacion = (estado = EstadoCot.PENDIENTE) =>
        new Cotizacion(
            1,
            new Date('2024-02-01'),
            'Dr. Martinez',
            'TechCorp SA',
            'Licencia Software Pro',
            'Juan Perez',
            'Desarrollo Customizado',
            '5000.00',
            TipoMoneda.USD,
            estado,
            'Incluye 3 meses de soporte',
            'https://proposal.techcorp.com/cot-001',
            1,
            1,
            1,
            createdAt,
            createdAt,
            null,
        );

    describe('send()', () => {
        it('should change state from PENDIENTE to ENVIADA', () => {
            const cot = buildCotizacion();
            cot.send();

            expect(cot.estado).toBe(EstadoCot.ENVIADA);
            expect(cot.updated_at.getTime()).toBeGreaterThan(
                createdAt.getTime(),
            );
        });

        it('should throw when not in PENDIENTE', () => {
            const cot = buildCotizacion(EstadoCot.ENVIADA);
            expect(() => cot.send()).toThrow(
                InvalidCotizacionTransitionException,
            );
        });

        it('should throw from ACEPTADA', () => {
            const cot = buildCotizacion(EstadoCot.ACEPTADA);
            expect(() => cot.send()).toThrow(
                InvalidCotizacionTransitionException,
            );
        });

        it('should throw from RECHAZADA', () => {
            const cot = buildCotizacion(EstadoCot.RECHAZADA);
            expect(() => cot.send()).toThrow(
                InvalidCotizacionTransitionException,
            );
        });
    });

    describe('accept()', () => {
        it('should change state from PENDIENTE to ACEPTADA', () => {
            const cot = buildCotizacion();
            cot.accept();

            expect(cot.estado).toBe(EstadoCot.ACEPTADA);
            expect(cot.updated_at.getTime()).toBeGreaterThan(
                createdAt.getTime(),
            );
        });

        it('should change state from ENVIADA to ACEPTADA', () => {
            const cot = buildCotizacion(EstadoCot.ENVIADA);
            cot.accept();

            expect(cot.estado).toBe(EstadoCot.ACEPTADA);
        });

        it('should throw when already ACEPTADA', () => {
            const cot = buildCotizacion(EstadoCot.ACEPTADA);
            expect(() => cot.accept()).toThrow(
                InvalidCotizacionTransitionException,
            );
        });

        it('should throw when already RECHAZADA', () => {
            const cot = buildCotizacion(EstadoCot.RECHAZADA);
            expect(() => cot.accept()).toThrow(
                InvalidCotizacionTransitionException,
            );
        });
    });

    describe('reject()', () => {
        it('should change state from PENDIENTE to RECHAZADA', () => {
            const cot = buildCotizacion();
            cot.reject();

            expect(cot.estado).toBe(EstadoCot.RECHAZADA);
            expect(cot.updated_at.getTime()).toBeGreaterThan(
                createdAt.getTime(),
            );
        });

        it('should change state from ENVIADA to RECHAZADA', () => {
            const cot = buildCotizacion(EstadoCot.ENVIADA);
            cot.reject();

            expect(cot.estado).toBe(EstadoCot.RECHAZADA);
        });

        it('should throw when already ACEPTADA', () => {
            const cot = buildCotizacion(EstadoCot.ACEPTADA);
            expect(() => cot.reject()).toThrow(
                InvalidCotizacionTransitionException,
            );
        });

        it('should throw when already RECHAZADA', () => {
            const cot = buildCotizacion(EstadoCot.RECHAZADA);
            expect(() => cot.reject()).toThrow(
                InvalidCotizacionTransitionException,
            );
        });
    });

    describe('syncWithLeadState()', () => {
        it('maps CIERRE_CON_VENTA to ACEPTADA', () => {
            const cot = buildCotizacion(EstadoCot.ENVIADA);
            const changed = cot.syncWithLeadState(LeadState.CIERRE_CON_VENTA);

            expect(changed).toBe(true);
            expect(cot.estado).toBe(EstadoCot.ACEPTADA);
            expect(cot.updated_at.getTime()).toBeGreaterThan(
                createdAt.getTime(),
            );
        });

        it('maps CIERRE_SIN_VENTA to RECHAZADA', () => {
            const cot = buildCotizacion(EstadoCot.PENDIENTE);
            const changed = cot.syncWithLeadState(LeadState.CIERRE_SIN_VENTA);

            expect(changed).toBe(true);
            expect(cot.estado).toBe(EstadoCot.RECHAZADA);
        });

        it('reopens to PENDIENTE when the lead returns to OFERTADO', () => {
            const cot = buildCotizacion(EstadoCot.ACEPTADA);
            const changed = cot.syncWithLeadState(LeadState.OFERTADO);

            expect(changed).toBe(true);
            expect(cot.estado).toBe(EstadoCot.PENDIENTE);
        });

        it('crosses directly from ACEPTADA to RECHAZADA (no guard)', () => {
            const cot = buildCotizacion(EstadoCot.ACEPTADA);
            const changed = cot.syncWithLeadState(LeadState.CIERRE_SIN_VENTA);

            expect(changed).toBe(true);
            expect(cot.estado).toBe(EstadoCot.RECHAZADA);
        });

        it('returns false and does not touch the state when already matching', () => {
            const cot = buildCotizacion(EstadoCot.ACEPTADA);
            const before = cot.updated_at;

            const changed = cot.syncWithLeadState(LeadState.CIERRE_CON_VENTA);

            expect(changed).toBe(false);
            expect(cot.estado).toBe(EstadoCot.ACEPTADA);
            expect(cot.updated_at).toBe(before);
        });

        it('returns false for EN_PROSPECTO (no mapping)', () => {
            const cot = buildCotizacion(EstadoCot.PENDIENTE);

            const changed = cot.syncWithLeadState(LeadState.EN_PROSPECTO);

            expect(changed).toBe(false);
            expect(cot.estado).toBe(EstadoCot.PENDIENTE);
        });
    });

    describe('markAsDeleted()', () => {
        it('should set deleted_at', () => {
            const cot = buildCotizacion();
            expect(cot.deleted_at).toBeNull();

            cot.markAsDeleted();

            expect(cot.deleted_at).toBeInstanceOf(Date);
            expect(cot.updated_at.getTime()).toBeGreaterThan(
                createdAt.getTime(),
            );
        });
    });

    describe('preserve quotation details during state changes', () => {
        it('should preserve fields on accept', () => {
            const cot = buildCotizacion();
            const originalMonto = cot.monto;
            const originalCliente = cot.cliente;
            const originalProducto = cot.producto;

            cot.accept();

            expect(cot.monto).toBe(originalMonto);
            expect(cot.cliente).toBe(originalCliente);
            expect(cot.producto).toBe(originalProducto);
        });
    });
});
