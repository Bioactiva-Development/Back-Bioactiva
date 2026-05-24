import { describe, expect, it } from '@jest/globals';

import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

describe('Quotations module', () => {
	/**
	 * Cotizacion entity
	 * ----------
	 * Responsable de:
	 * - aceptar cotización y cambiar estado
	 * - rechazar cotización y cambiar estado
	 * - marcar como pendiente
	 * - mantener trazabilidad de cambios
	 */
	// STATUS: Implementación completa (métodos de dominio y transiciones de estado).
	describe('Cotizacion entity domain rules', () => {
		const createdAt = new Date('2024-01-01T00:00:00.000Z');

		const buildCotizacion = () =>
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
				EstadoCot.PENDIENTE,
				'Incluye 3 meses de soporte',
				'https://proposal.techcorp.com/cot-001',
				1,
				1,
				createdAt,
				createdAt,
			);

		it('should accept quotation and change state', () => {
			const cot = buildCotizacion();
			const oldUpdatedAt = cot.updated_at;

			cot.accept();

			expect(cot.estado).toBe(EstadoCot.ACEPTADA);
			expect(cot.updated_at.getTime()).toBeGreaterThan(
				oldUpdatedAt.getTime(),
			);
		});

		it('should reject quotation and change state', () => {
			const cot = buildCotizacion();
			const oldUpdatedAt = cot.updated_at;

			cot.reject();

			expect(cot.estado).toBe(EstadoCot.RECHAZADA);
			expect(cot.updated_at.getTime()).toBeGreaterThan(
				oldUpdatedAt.getTime(),
			);
		});

		it('should mark quotation as pending', () => {
			const cot = buildCotizacion();
			// First change state to something else
			cot.accept();
			const updatedAtAfterAccept = cot.updated_at;

			// Then mark as pending
			cot.markPending();

			expect(cot.estado).toBe(EstadoCot.PENDIENTE);
			expect(cot.updated_at.getTime()).toBeGreaterThanOrEqual(
				updatedAtAfterAccept.getTime(),
			);
		});

		it('should allow state transitions from pending to accepted to rejected', () => {
			const cot = buildCotizacion();
			expect(cot.estado).toBe(EstadoCot.PENDIENTE);

			cot.accept();
			expect(cot.estado).toBe(EstadoCot.ACEPTADA);

			cot.reject();
			expect(cot.estado).toBe(EstadoCot.RECHAZADA);

			cot.markPending();
			expect(cot.estado).toBe(EstadoCot.PENDIENTE);
		});

		it('should allow accepting already accepted quotation (idempotent)', () => {
			const cot = buildCotizacion();
			cot.accept();
			const updatedAtAfterFirstAccept = cot.updated_at;

			// Accept again
			cot.accept();

			expect(cot.estado).toBe(EstadoCot.ACEPTADA);
			expect(cot.updated_at.getTime()).toBeGreaterThanOrEqual(
				updatedAtAfterFirstAccept.getTime(),
			);
		});

		it('should allow rejecting already rejected quotation (idempotent)', () => {
			const cot = buildCotizacion();
			cot.reject();
			const updatedAtAfterFirstReject = cot.updated_at;

			// Reject again
			cot.reject();

			expect(cot.estado).toBe(EstadoCot.RECHAZADA);
			expect(cot.updated_at.getTime()).toBeGreaterThanOrEqual(
				updatedAtAfterFirstReject.getTime(),
			);
		});

		it('should preserve quotation details during state changes', () => {
			const cot = buildCotizacion();
			const originalMonto = cot.monto;
			const originalCliente = cot.cliente;
			const originalProducto = cot.producto;

			cot.accept();

			expect(cot.monto).toBe(originalMonto);
			expect(cot.cliente).toBe(originalCliente);
			expect(cot.producto).toBe(originalProducto);
		});

		it('should track state transitions with timestamps', () => {
			const cot = buildCotizacion();
			const initialTime = cot.updated_at;

			cot.accept();
			const acceptedTime = cot.updated_at;

			cot.reject();
			const rejectedTime = cot.updated_at;

			expect(acceptedTime.getTime()).toBeGreaterThanOrEqual(initialTime.getTime());
			expect(rejectedTime.getTime()).toBeGreaterThanOrEqual(
				acceptedTime.getTime(),
			);
		});

		it('should allow marking as pending from any state', () => {
			const cot1 = buildCotizacion();
			cot1.accept();
			cot1.markPending();
			expect(cot1.estado).toBe(EstadoCot.PENDIENTE);

			const cot2 = buildCotizacion();
			cot2.reject();
			cot2.markPending();
			expect(cot2.estado).toBe(EstadoCot.PENDIENTE);
		});
	});
});
