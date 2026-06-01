import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CancelActivityUseCase } from '@/modules/activities/application/use-cases/cancel-activity.use-case';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { InvalidActivityTransitionException } from '@/modules/activities/domain/exceptions/invalid-activity-transition.exception';

/**
 * CancelActivityUseCase
 * ---------------------
 * Transición PENDIENTE -> CANCELADA (RN-008).
 * - Cancela una actividad pendiente y la persiste.
 * - Lanza ActivityNotFoundException cuando no existe.
 * - Rechaza cancelar desde CANCELADA o REALIZADA → InvalidActivityTransitionException.
 */
describe('Activities module', () => {
    describe('CancelActivityUseCase', () => {
        let useCase: CancelActivityUseCase;
        let activityRepository: any;
        let calendarSync: any;

        const buildActividad = (
            estado = EstadoActividad.PENDIENTE,
            outlookEventId: string | null = null,
        ) =>
            new Actividad(
                1,
                'Llamada',
                new Date('2026-06-01T10:00:00.000Z'),
                new Date('2026-06-01T11:00:00.000Z'),
                TipoActividad.LLAMADA,
                estado,
                null,
                outlookEventId,
                false,
                null,
                false,
                1,
                1,
                new Date(),
                new Date(),
                null,
            );

        beforeEach(() => {
            activityRepository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            calendarSync = {
                isUserConnected: jest.fn(),
                createCalendarEvent: jest.fn(),
                updateCalendarEvent: jest.fn(),
                deleteCalendarEvent: jest.fn(),
                createTeamsMeeting: jest.fn(),
            };
            useCase = new CancelActivityUseCase(activityRepository, calendarSync);
        });

        it('should cancel a pending activity', async () => {
            const actividad = buildActividad();
            activityRepository.findById.mockResolvedValue(actividad);
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: actividad,
            });

            await useCase.execute(1);

            expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
            expect(activityRepository.saveWithRelations).toHaveBeenCalledWith(
                actividad,
            );
        });

        it('should throw when activity is not found', async () => {
            activityRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toThrow(
                ActivityNotFoundException,
            );
        });

        it('should throw when activity is already CANCELADA', async () => {
            activityRepository.findById.mockResolvedValue(
                buildActividad(EstadoActividad.CANCELADA),
            );

            await expect(useCase.execute(1)).rejects.toThrow(
                InvalidActivityTransitionException,
            );
            expect(activityRepository.saveWithRelations).not.toHaveBeenCalled();
        });

        it('should throw when activity is REALIZADA', async () => {
            activityRepository.findById.mockResolvedValue(
                buildActividad(EstadoActividad.REALIZADA),
            );

            await expect(useCase.execute(1)).rejects.toThrow(
                InvalidActivityTransitionException,
            );
        });

        // Caso 5: cancelar actividad sincronizada -> evento Outlook cancelado
        it('should cancel the Outlook event when the activity is synced', async () => {
            const actividad = buildActividad(
                EstadoActividad.PENDIENTE,
                'outlook-123',
            );
            activityRepository.findById.mockResolvedValue(actividad);
            calendarSync.deleteCalendarEvent.mockResolvedValue(undefined);
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: actividad,
            });

            await useCase.execute(1);

            expect(calendarSync.deleteCalendarEvent).toHaveBeenCalledWith(
                1,
                'outlook-123',
            );
            expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
            expect(actividad.outlook_event_id).toBeNull();
            expect(actividad.teams_meeting_url).toBeNull();
        });

        // RN-003: un error de Microsoft no impide cancelar la actividad
        it('should still cancel the activity when Outlook deletion fails', async () => {
            const actividad = buildActividad(
                EstadoActividad.PENDIENTE,
                'outlook-123',
            );
            activityRepository.findById.mockResolvedValue(actividad);
            calendarSync.deleteCalendarEvent.mockRejectedValue(
                new Error('Graph API down'),
            );
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: actividad,
            });

            await useCase.execute(1);

            expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
            expect(actividad.outlook_event_id).toBe('outlook-123');
            expect(activityRepository.saveWithRelations).toHaveBeenCalledWith(
                actividad,
            );
        });
    });
});
