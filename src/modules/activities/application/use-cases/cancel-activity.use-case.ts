import { Logger } from '@nestjs/common';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
} from '@/modules/activities/domain/ports/activity-repository.port';
import {
    CALENDAR_SYNC,
    type CalendarSyncPort,
} from '@/modules/integrations/domain/ports/calendar-sync.port';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

export class CancelActivityUseCase {
    private readonly logger = new Logger(CancelActivityUseCase.name);

    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
        @Inject(CALENDAR_SYNC)
        private readonly calendarSync: CalendarSyncPort,
    ) {}

    async execute(id: number) {
        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new ActivityNotFoundException(
                `Actividad con id ${id} no encontrada`,
            );
        }

        activity.cancel();

        if (activity.outlook_event_id) {
            await this.cancelOutlookEvent(activity);
        }

        return await this.activityRepository.saveWithRelations(activity);
    }

    /**
     * Cancela el evento de Outlook asociado. Si la eliminación tiene éxito se
     * limpian las referencias. Los errores de Microsoft se capturan y registran
     * sin impedir que la actividad quede CANCELADA en el CRM (RN-003).
     */
    private async cancelOutlookEvent(activity: Actividad): Promise<void> {
        try {
            await this.calendarSync.deleteCalendarEvent(
                activity.id_responsable,
                activity.outlook_event_id!,
            );
            activity.outlook_event_id = null;
            activity.teams_meeting_url = null;
        } catch (error) {
            this.logger.error(
                `Falló la cancelación en Outlook de la actividad ${activity.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
