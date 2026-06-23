import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CancelActivityUseCase } from '@/modules/activities/application/use-cases/cancel-activity.use-case';
import { UpdateActivityUseCase } from '@/modules/activities/application/use-cases/update-activity.use-case';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityCalendarEventAlreadyExistsException } from '@/modules/activities/domain/exceptions/activity-calendar-event-exists.exception';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

/**
 * Branch coverage extra:
 * - cancel/update use-cases: el catch usa `String(error)` cuando el calendario
 *   lanza un valor que NO es Error.
 * - ActivityCalendarEventAlreadyExistsException: constructor sin argumento usa
 *   el mensaje por defecto.
 */
describe('Activities module — branches2', () => {
    const buildActividad = (outlookEventId: string | null = 'outlook-123') =>
        new Actividad(
            1,
            'Llamada',
            new Date('2026-06-01T10:00:00.000Z'),
            new Date('2026-06-01T11:00:00.000Z'),
            TipoActividad.LLAMADA,
            EstadoActividad.PENDIENTE,
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

    describe('CancelActivityUseCase', () => {
        let activityRepository: any;
        let calendarSync: any;
        let useCase: CancelActivityUseCase;

        beforeEach(() => {
            activityRepository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            calendarSync = {
                deleteCalendarEvent: jest.fn(),
            };
            useCase = new CancelActivityUseCase(
                activityRepository,
                calendarSync,
            );
        });

        it('uses String(error) when Outlook deletion throws a non-Error', async () => {
            const actividad = buildActividad('outlook-123');
            activityRepository.findById.mockResolvedValue(actividad);
            calendarSync.deleteCalendarEvent.mockImplementation(() => {
                throw 'boom';
            });
            activityRepository.saveWithRelations.mockResolvedValue({});

            await useCase.execute(1);

            // La actividad queda cancelada pese al fallo no-Error.
            expect(actividad.estado).toBe(EstadoActividad.CANCELADA);
            expect(actividad.outlook_event_id).toBe('outlook-123');
        });
    });

    describe('UpdateActivityUseCase', () => {
        let activityRepository: any;
        let calendarSync: any;
        let useCase: UpdateActivityUseCase;

        beforeEach(() => {
            activityRepository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            const appTime = { timeZone: 'America/Lima' } as AppTimeConfig;
            calendarSync = {
                updateCalendarEvent: jest.fn(),
            };
            useCase = new UpdateActivityUseCase(
                activityRepository,
                calendarSync,
                appTime,
            );
        });

        it('uses String(error) when Outlook update throws a non-Error', async () => {
            const actividad = buildActividad('outlook-123');
            activityRepository.findById.mockResolvedValue(actividad);
            activityRepository.saveWithRelations.mockResolvedValue({});
            calendarSync.updateCalendarEvent.mockImplementation(() => {
                throw 'kaboom';
            });

            await useCase.execute(1, { nombreActividad: 'Nuevo nombre' } as any);

            expect(activityRepository.saveWithRelations).toHaveBeenCalledWith(
                actividad,
            );
        });
    });

    describe('ActivityCalendarEventAlreadyExistsException', () => {
        it('uses the default message when constructed with no argument', () => {
            const exception = new ActivityCalendarEventAlreadyExistsException();
            expect(exception.message).toBe(
                'La actividad ya tiene un evento de calendario asociado',
            );
        });
    });
});
