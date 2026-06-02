import { describe, expect, it } from '@jest/globals';

import { Notificacion } from '@/modules/notifications/domain/entities/notificacion';
import { EstadoNotificacion } from '@/modules/notifications/domain/enums/estado-notificacion';

describe('Notifications module', () => {
    /**
     * Notificacion entity
     * ----------
     * Responsable de:
     * - crear notificaciones con estado inicial NO_LEIDA
     * - marcar notificaciones como leídas
     * - mantener integridad de datos de notificación
     */
    // STATUS: Implementación completa (métodos de dominio).
    describe('Notificacion entity domain rules', () => {
        const createdAt = new Date('2024-01-01T00:00:00.000Z');

        const buildNotificacion = () =>
            new Notificacion(
                1,
                'Nuevo lead asignado',
                'Se ha asignado un nuevo lead de TechCorp SA para seguimiento',
                EstadoNotificacion.NO_LEIDA,
                1,
                42,
                createdAt,
            );

        it('should create notification with NO_LEIDA state', () => {
            const notificacion = buildNotificacion();

            expect(notificacion.estado).toBe(EstadoNotificacion.NO_LEIDA);
            expect(notificacion.id).toBe(1);
            expect(notificacion.id_usuario).toBe(1);
            expect(notificacion.id_actividad).toBe(42);
        });

        it('should mark notification as read', () => {
            const notificacion = buildNotificacion();

            notificacion.markRead();

            expect(notificacion.estado).toBe(EstadoNotificacion.LEIDA);
        });

        it('should allow marking as read multiple times (idempotent)', () => {
            const notificacion = buildNotificacion();

            notificacion.markRead();
            expect(notificacion.estado).toBe(EstadoNotificacion.LEIDA);

            // Mark as read again
            notificacion.markRead();

            expect(notificacion.estado).toBe(EstadoNotificacion.LEIDA);
        });

        it('should preserve notification data when marking as read', () => {
            const notificacion = buildNotificacion();
            const originalTitulo = notificacion.titulo;
            const originalMensaje = notificacion.mensaje;
            const originalUsuario = notificacion.id_usuario;

            notificacion.markRead();

            expect(notificacion.titulo).toBe(originalTitulo);
            expect(notificacion.mensaje).toBe(originalMensaje);
            expect(notificacion.id_usuario).toBe(originalUsuario);
        });

        it('should maintain created_at timestamp (immutable)', () => {
            const notificacion = buildNotificacion();
            const originalCreatedAt = notificacion.created_at;

            notificacion.markRead();

            expect(notificacion.created_at).toEqual(originalCreatedAt);
        });

        it('should accept default state in constructor', () => {
            const notificacion = new Notificacion(
                2,
                'Recordatorio',
                'Llamada pendiente con cliente',
                EstadoNotificacion.NO_LEIDA, // Explicit
                2,
                43,
                createdAt,
            );

            expect(notificacion.estado).toBe(EstadoNotificacion.NO_LEIDA);
        });

        it('should use default NO_LEIDA state when not provided', () => {
            const notificacion = new Notificacion(
                3,
                'Default',
                'Mensaje default',
                undefined as any,
                3,
                44,
                createdAt,
            );

            expect(notificacion.estado).toBe(EstadoNotificacion.NO_LEIDA);
        });
    });
});
