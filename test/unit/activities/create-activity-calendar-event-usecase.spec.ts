import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateActivityCalendarEventUseCase } from '@/modules/activities/application/use-cases/create-activity-calendar-event.use-case';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { ActivityNotMeetingException } from '@/modules/activities/domain/exceptions/activity-not-meeting.exception';
import { ActivityCalendarEventAlreadyExistsException } from '@/modules/activities/domain/exceptions/activity-calendar-event-exists.exception';
import { ResponsibleNotConnectedException } from '@/modules/activities/domain/exceptions/responsible-not-connected.exception';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

describe('Activities module', () => {
    describe('CreateActivityCalendarEventUseCase', () => {
        let useCase: CreateActivityCalendarEventUseCase;
        let activityRepository: any;
        let calendarSync: any;

        const buildActivity = (
            tipo = TipoActividad.REUNION,
            outlookEventId: string | null = null,
        ) =>
            new Actividad(
                1,
                'Reunión con cliente',
                new Date('2026-06-20T15:00:00.000Z'),
                new Date('2026-06-20T16:00:00.000Z'),
                tipo,
                EstadoActividad.PENDIENTE,
                'Notas',
                outlookEventId,
                false,
                null,
                false,
                7,
                3,
                new Date(),
                new Date(),
                null,
            );

        beforeEach(() => {
            activityRepository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            const appTime = { timeZone: 'America/Lima' } as AppTimeConfig;
            calendarSync = {
                isUserConnected: jest.fn(),
                createCalendarEvent: jest.fn(),
            };
            useCase = new CreateActivityCalendarEventUseCase(
                activityRepository,
                calendarSync,
                appTime,
            );
        });

        it('creates the Outlook event and Teams meeting for a REUNION', async () => {
            const activity = buildActivity();
            activityRepository.findById.mockResolvedValue(activity);
            calendarSync.isUserConnected.mockResolvedValue(true);
            calendarSync.createCalendarEvent.mockResolvedValue({
                outlookEventId: 'evt-1',
                teamsJoinUrl: 'https://teams.microsoft.com/l/meetup-join/xyz',
            });
            activityRepository.saveWithRelations.mockResolvedValue({
                activity,
            });

            await useCase.execute(1);

            expect(calendarSync.createCalendarEvent).toHaveBeenCalledWith(
                3,
                expect.objectContaining({ subject: 'Reunión con cliente' }),
                { onlineMeeting: true },
            );
            expect(activity.outlook_event_id).toBe('evt-1');
            expect(activity.teams_meeting_url).toBe(
                'https://teams.microsoft.com/l/meetup-join/xyz',
            );
            expect(activityRepository.saveWithRelations).toHaveBeenCalledWith(
                activity,
            );
        });

        it('throws when the activity does not exist', async () => {
            activityRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(1)).rejects.toThrow(
                ActivityNotFoundException,
            );
        });

        it('throws when the activity is not a REUNION', async () => {
            activityRepository.findById.mockResolvedValue(
                buildActivity(TipoActividad.LLAMADA),
            );
            await expect(useCase.execute(1)).rejects.toThrow(
                ActivityNotMeetingException,
            );
            expect(calendarSync.createCalendarEvent).not.toHaveBeenCalled();
        });

        it('throws when the activity already has a calendar event', async () => {
            activityRepository.findById.mockResolvedValue(
                buildActivity(TipoActividad.REUNION, 'evt-existing'),
            );
            await expect(useCase.execute(1)).rejects.toThrow(
                ActivityCalendarEventAlreadyExistsException,
            );
        });

        it('throws when the responsible is not connected to Microsoft', async () => {
            activityRepository.findById.mockResolvedValue(buildActivity());
            calendarSync.isUserConnected.mockResolvedValue(false);
            await expect(useCase.execute(1)).rejects.toThrow(
                ResponsibleNotConnectedException,
            );
            expect(calendarSync.createCalendarEvent).not.toHaveBeenCalled();
        });
    });
});
