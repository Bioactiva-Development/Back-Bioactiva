import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
    type ActivityWithRelations,
} from '@/modules/activities/domain/ports/activity-repository.port';
import {
    CALENDAR_SYNC,
    type CalendarSyncPort,
} from '@/modules/integrations/domain/ports/calendar-sync.port';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { ActivityNotMeetingException } from '@/modules/activities/domain/exceptions/activity-not-meeting.exception';
import { ActivityCalendarEventAlreadyExistsException } from '@/modules/activities/domain/exceptions/activity-calendar-event-exists.exception';
import { ResponsibleNotConnectedException } from '@/modules/activities/domain/exceptions/responsible-not-connected.exception';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

/**
 * CU007 (Calendario, pasos 83-90): crea bajo demanda el evento en Outlook y la
 * reunión de Teams para una actividad de tipo REUNIÓN. A diferencia del flujo
 * anterior (automático al crear la actividad), aquí la acción es manual y sus
 * errores se propagan para informar al usuario.
 */
export class CreateActivityCalendarEventUseCase {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
        @Inject(CALENDAR_SYNC)
        private readonly calendarSync: CalendarSyncPort,
        private readonly appTime: AppTimeConfig,
    ) {}

    async execute(id: number): Promise<ActivityWithRelations> {
        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new ActivityNotFoundException(
                'La actividad no fue encontrada',
            );
        }

        if (activity.tipo !== TipoActividad.REUNION) {
            throw new ActivityNotMeetingException();
        }

        if (activity.outlook_event_id) {
            throw new ActivityCalendarEventAlreadyExistsException(
                'La actividad ya tiene un evento de calendario asociado',
            );
        }

        const connected = await this.calendarSync.isUserConnected(
            activity.id_responsable,
        );
        if (!connected) {
            throw new ResponsibleNotConnectedException();
        }

        const result = await this.calendarSync.createCalendarEvent(
            activity.id_responsable,
            {
                subject: activity.nombre_actividad,
                start: activity.fecha_inicio,
                end: activity.fecha_fin,
                body: activity.notas,
                timeZone: this.appTime.timeZone,
            },
            { onlineMeeting: true },
        );

        activity.outlook_event_id = result.outlookEventId;
        activity.teams_meeting_url = result.teamsJoinUrl;
        activity.updated_at = new Date();

        return this.activityRepository.saveWithRelations(activity);
    }
}
