import { describe, expect, it } from '@jest/globals';

import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { InvalidActivityDateException } from '@/modules/activities/domain/exceptions/invalid-activity-date.exception';
import { InvalidActivityTransitionException } from '@/modules/activities/domain/exceptions/invalid-activity-transition.exception';

/**
 * Actividad entity — domain rules
 * --------------------------------
 * Cubre el comportamiento del agregado en memoria, sin infraestructura:
 * - Estado inicial PENDIENTE (RN-005).
 * - Transiciones markCompleted / cancel solo desde PENDIENTE (RN-006, RN-007, RN-008);
 *   completar/cancelar desde REALIZADA o CANCELADA lanza InvalidActivityTransitionException.
 * - reschedule exige fechaInicio < fechaFin (RN-003) → InvalidActivityDateException.
 * - markAsDeleted aplica el borrado lógico (deletedAt + updatedAt).
 */
describe('Activities module', () => {
    describe('Actividad entity domain rules', () => {
        const createdAt = new Date('2024-01-01T00:00:00.000Z');
        const updatedAt = new Date('2024-01-02T00:00:00.000Z');
        const fechaInicio = new Date('2024-02-15T10:00:00.000Z');
        const fechaFin = new Date('2024-02-15T11:00:00.000Z');

        const buildActividad = (estado = EstadoActividad.PENDIENTE) =>
            new Actividad(
                1,
                'Llamada de seguimiento',
                fechaInicio,
                fechaFin,
                TipoActividad.LLAMADA,
                estado,
                'Confirmar detalles del proyecto',
                null,
                false,
                null,
                false,
                1,
                1,
                createdAt,
                updatedAt,
                null,
            );

        it('should create activity with PENDIENTE state', () => {
            const actividad = buildActividad();

            expect(actividad.estado).toBe(EstadoActividad.PENDIENTE);
            expect(actividad.nombre_actividad).toBe('Llamada de seguimiento');
            expect(actividad.tipo).toBe(TipoActividad.LLAMADA);
            expect(actividad.deleted_at).toBeNull();
        });

        describe('markCompleted', () => {
            it('should transition PENDIENTE -> REALIZADA', () => {
                const actividad = buildActividad();
                const oldUpdatedAt = actividad.updated_at;

                actividad.markCompleted();

                expect(actividad.estado).toBe(EstadoActividad.REALIZADA);
                expect(actividad.updated_at.getTime()).toBeGreaterThan(
                    oldUpdatedAt.getTime(),
                );
            });

            it('should throw when activity is already REALIZADA', () => {
                const actividad = buildActividad(EstadoActividad.REALIZADA);

                expect(() => actividad.markCompleted()).toThrow(
                    InvalidActivityTransitionException,
                );
                expect(actividad.estado).toBe(EstadoActividad.REALIZADA);
            });

            it('should throw when activity is CANCELADA', () => {
                const actividad = buildActividad(EstadoActividad.CANCELADA);

                expect(() => actividad.markCompleted()).toThrow(
                    InvalidActivityTransitionException,
                );
                expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
            });
        });

        describe('cancel', () => {
            it('should transition PENDIENTE -> CANCELADA', () => {
                const actividad = buildActividad();
                const oldUpdatedAt = actividad.updated_at;

                actividad.cancel();

                expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
                expect(actividad.updated_at.getTime()).toBeGreaterThan(
                    oldUpdatedAt.getTime(),
                );
            });

            it('should throw when activity is already CANCELADA', () => {
                const actividad = buildActividad(EstadoActividad.CANCELADA);
                const updatedAtBefore = actividad.updated_at;

                expect(() => actividad.cancel()).toThrow(
                    InvalidActivityTransitionException,
                );
                expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
                expect(actividad.updated_at).toEqual(updatedAtBefore);
            });

            it('should throw when activity is REALIZADA', () => {
                const actividad = buildActividad(EstadoActividad.REALIZADA);

                expect(() => actividad.cancel()).toThrow(
                    InvalidActivityTransitionException,
                );
                expect(actividad.estado).toBe(EstadoActividad.REALIZADA);
            });
        });

        describe('reschedule', () => {
            it('should reschedule to new valid dates', () => {
                const actividad = buildActividad();
                const oldUpdatedAt = actividad.updated_at;
                const newFechaInicio = new Date('2024-03-01T14:00:00.000Z');
                const newFechaFin = new Date('2024-03-01T15:30:00.000Z');

                actividad.reschedule(newFechaInicio, newFechaFin);

                expect(actividad.fecha_inicio).toEqual(newFechaInicio);
                expect(actividad.fecha_fin).toEqual(newFechaFin);
                expect(actividad.updated_at.getTime()).toBeGreaterThan(
                    oldUpdatedAt.getTime(),
                );
            });

            it('should throw when end date is before start date', () => {
                const actividad = buildActividad();
                const newFechaInicio = new Date('2024-03-01T15:00:00.000Z');
                const newFechaFin = new Date('2024-03-01T14:00:00.000Z');

                expect(() =>
                    actividad.reschedule(newFechaInicio, newFechaFin),
                ).toThrow(InvalidActivityDateException);
                expect(actividad.fecha_inicio).toEqual(fechaInicio);
                expect(actividad.fecha_fin).toEqual(fechaFin);
            });

            it('should throw when end date equals start date', () => {
                const actividad = buildActividad();
                const sameDate = new Date('2024-03-01T14:00:00.000Z');

                expect(() => actividad.reschedule(sameDate, sameDate)).toThrow(
                    InvalidActivityDateException,
                );
            });
        });

        describe('markAsDeleted', () => {
            it('should set deleted_at when marking as deleted', () => {
                const actividad = buildActividad();

                expect(actividad.deleted_at).toBeNull();

                actividad.markAsDeleted();

                expect(actividad.deleted_at).toBeInstanceOf(Date);
            });

            it('should update updated_at when marking as deleted', () => {
                const actividad = buildActividad();
                const oldUpdatedAt = actividad.updated_at;

                actividad.markAsDeleted();

                expect(actividad.updated_at.getTime()).toBeGreaterThan(
                    oldUpdatedAt.getTime(),
                );
            });
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

        it('should handle different activity types', () => {
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
                null,
            );

            expect(emailActivity.tipo).toBe(TipoActividad.EMAIL);

            emailActivity.markCompleted();
            expect(emailActivity.estado).toBe(EstadoActividad.REALIZADA);
        });
    });
});
