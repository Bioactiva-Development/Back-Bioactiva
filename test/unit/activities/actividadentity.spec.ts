import { describe, expect, it } from '@jest/globals';

import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';

describe('Activities module', () => {
	/**
	 * Actividad entity
	 * ----------
	 * Responsable de:
	 * - marcar actividades como completadas
	 * - cancelar actividades con validación
	 * - reagendar actividades con validación de fechas
	 * - mantener trazabilidad de cambios
	 */
	// STATUS: Implementación completa (métodos de dominio y validaciones de fechas).
	describe('Actividad entity domain rules', () => {
		const createdAt = new Date('2024-01-01T00:00:00.000Z');
		const updatedAt = new Date('2024-01-02T00:00:00.000Z');
		const fechaInicio = new Date('2024-02-15T10:00:00.000Z');
		const fechaFin = new Date('2024-02-15T11:00:00.000Z');

		const buildActividad = () =>
			new Actividad(
				1,
				'Llamada de seguimiento',
				fechaInicio,
				fechaFin,
				TipoActividad.LLAMADA,
				EstadoActividad.PENDIENTE,
				'Confirmar detalles del proyecto',
				null,
				false,
				null,
				false,
				1,
				1,
				createdAt,
				updatedAt,
			);

		it('should create activity with PENDIENTE state', () => {
			const actividad = buildActividad();

			expect(actividad.estado).toBe(EstadoActividad.PENDIENTE);
			expect(actividad.nombre_actividad).toBe('Llamada de seguimiento');
			expect(actividad.tipo).toBe(TipoActividad.LLAMADA);
		});

		it('should mark activity as completed', () => {
			const actividad = buildActividad();
			const oldUpdatedAt = actividad.updated_at;

			actividad.markCompleted();

			expect(actividad.estado).toBe(EstadoActividad.REALIZADA);
			expect(actividad.updated_at.getTime()).toBeGreaterThanOrEqual(
				oldUpdatedAt.getTime(),
			);
		});

		it('should cancel activity', () => {
			const actividad = buildActividad();
			const oldUpdatedAt = actividad.updated_at;

			actividad.cancel();

			expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
			expect(actividad.updated_at.getTime()).toBeGreaterThanOrEqual(
				oldUpdatedAt.getTime(),
			);
		});

		it('should throw error when canceling already cancelled activity', () => {
			const actividad = buildActividad();
			actividad.cancel();
			const updatedAtAfterCancel = actividad.updated_at;

			expect(() => actividad.cancel()).toThrow(
				'La actividad ya está cancelada',
			);
			expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
			expect(actividad.updated_at).toEqual(updatedAtAfterCancel); // Unchanged
		});

		it('should reschedule activity to new dates', () => {
			const actividad = buildActividad();
			const oldUpdatedAt = actividad.updated_at;
			const newFechaInicio = new Date('2024-03-01T14:00:00.000Z');
			const newFechaFin = new Date('2024-03-01T15:30:00.000Z');

			actividad.reschedule(newFechaInicio, newFechaFin);

			expect(actividad.fecha_inicio).toEqual(newFechaInicio);
			expect(actividad.fecha_fin).toEqual(newFechaFin);
			expect(actividad.updated_at.getTime()).toBeGreaterThanOrEqual(
				oldUpdatedAt.getTime(),
			);
		});

		it('should throw error when end date is before start date', () => {
			const actividad = buildActividad();
			const newFechaInicio = new Date('2024-03-01T15:00:00.000Z');
			const newFechaFin = new Date('2024-03-01T14:00:00.000Z'); // Before start

			expect(() =>
				actividad.reschedule(newFechaInicio, newFechaFin),
			).toThrow('La fecha fin no puede ser anterior a la fecha inicio');
			expect(actividad.fecha_inicio).toEqual(fechaInicio); // Unchanged
			expect(actividad.fecha_fin).toEqual(fechaFin); // Unchanged
		});

		it('should allow rescheduling with same start and end date', () => {
			const actividad = buildActividad();
			const sameDateInicio = new Date('2024-03-01T14:00:00.000Z');
			const sameDateFin = new Date('2024-03-01T14:00:00.000Z');

			actividad.reschedule(sameDateInicio, sameDateFin);

			expect(actividad.fecha_inicio).toEqual(sameDateInicio);
			expect(actividad.fecha_fin).toEqual(sameDateFin);
		});

		it('should allow multiple reschedules', () => {
			const actividad = buildActividad();

			const fecha1Inicio = new Date('2024-03-01T10:00:00.000Z');
			const fecha1Fin = new Date('2024-03-01T11:00:00.000Z');
			actividad.reschedule(fecha1Inicio, fecha1Fin);
			expect(actividad.fecha_inicio).toEqual(fecha1Inicio);

			const fecha2Inicio = new Date('2024-04-01T14:00:00.000Z');
			const fecha2Fin = new Date('2024-04-01T15:00:00.000Z');
			actividad.reschedule(fecha2Inicio, fecha2Fin);
			expect(actividad.fecha_inicio).toEqual(fecha2Inicio);
		});

		it('should preserve activity data during state transitions', () => {
			const actividad = buildActividad();
			const originalNombre = actividad.nombre_actividad;
			const originalTipo = actividad.tipo;
			const originalLead = actividad.id_lead;

			actividad.markCompleted();

			expect(actividad.nombre_actividad).toBe(originalNombre);
			expect(actividad.tipo).toBe(originalTipo);
			expect(actividad.id_lead).toBe(originalLead);
		});

		it('should allow completing activity multiple times (idempotent)', () => {
			const actividad = buildActividad();
			actividad.markCompleted();
			const firstCompletedAt = actividad.updated_at;

			actividad.markCompleted();

			expect(actividad.estado).toBe(EstadoActividad.REALIZADA);
			expect(actividad.updated_at.getTime()).toBeGreaterThanOrEqual(
				firstCompletedAt.getTime(),
			);
		});

		it('should handle different activity types', () => {
			const callActivity = buildActividad();
			expect(callActivity.tipo).toBe(TipoActividad.LLAMADA);

			const emailActivity = new Actividad(
				2,
				'Envío de propuesta',
				fechaInicio,
				fechaFin,
				TipoActividad.EMAIL,
				EstadoActividad.PENDIENTE,
				'Propuesta detallada para cliente',
				null,
				false,
				null,
				false,
				1,
				1,
				createdAt,
				updatedAt,
			);
			expect(emailActivity.tipo).toBe(TipoActividad.EMAIL);

			emailActivity.markCompleted();
			expect(emailActivity.estado).toBe(EstadoActividad.REALIZADA);
		});
	});
});
