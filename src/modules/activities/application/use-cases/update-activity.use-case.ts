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
import { UpdateActivityDto } from '@/modules/activities/application/dto/update-activity.dto';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

export class UpdateActivityUseCase {
    private readonly logger = new Logger(UpdateActivityUseCase.name);

    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
        @Inject(CALENDAR_SYNC)
        private readonly calendarSync: CalendarSyncPort,
    ) {}

    async execute(id: number, dto: UpdateActivityDto) {
        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new ActivityNotFoundException(
                `Actividad con id ${id} no encontrada`,
            );
        }

        // El responsable no se actualiza desde la petición: es siempre el
        // encargado del lead (regla de negocio). Cualquier idResponsable recibido
        // se ignora.

        if (dto.nombreActividad !== undefined) {
            activity.nombre_actividad = dto.nombreActividad;
        }
        if (dto.notas !== undefined) {
            activity.notas = dto.notas;
        }

        if (dto.fechaInicio !== undefined || dto.fechaFin !== undefined) {
            const nuevaFechaInicio = dto.fechaInicio ?? activity.fecha_inicio;
            const nuevaFechaFin = dto.fechaFin ?? activity.fecha_fin;
            activity.reschedule(nuevaFechaInicio, nuevaFechaFin);
        }

        activity.updated_at = new Date();

        const result =
            await this.activityRepository.saveWithRelations(activity);

        if (activity.outlook_event_id) {
            await this.syncUpdateWithMicrosoft(activity);
        }

        return result;
    }

    /**
     * Refleja los cambios de la actividad en su evento de Outlook. Los errores
     * de Microsoft se capturan y registran sin afectar la actualización en el
     * CRM (RN-003).
     */
    private async syncUpdateWithMicrosoft(activity: Actividad): Promise<void> {
        try {
            await this.calendarSync.updateCalendarEvent(
                activity.id_responsable,
                activity.outlook_event_id!,
                {
                    subject: activity.nombre_actividad,
                    start: activity.fecha_inicio,
                    end: activity.fecha_fin,
                    body: activity.notas,
                },
            );
        } catch (error) {
            this.logger.error(
                `Falló la actualización en Outlook de la actividad ${activity.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
