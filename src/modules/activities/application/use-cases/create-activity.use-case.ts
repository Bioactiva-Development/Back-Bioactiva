import { Logger } from '@nestjs/common';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
} from '@/modules/activities/domain/ports/activity-repository.port';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import {
    CALENDAR_SYNC,
    type CalendarSyncPort,
} from '@/modules/integrations/domain/ports/calendar-sync.port';
import { CreateActivityDto } from '@/modules/activities/application/dto/create-activity.dto';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { InvalidActivityDateException } from '@/modules/activities/domain/exceptions/invalid-activity-date.exception';
import { PendingActivityExistsException } from '@/modules/activities/domain/exceptions/pending-activity-exists.exception';

export class CreateActivityUseCase {
    private readonly logger = new Logger(CreateActivityUseCase.name);

    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        @Inject(CALENDAR_SYNC)
        private readonly calendarSync: CalendarSyncPort,
    ) {}

    async execute(dto: CreateActivityDto) {
        const lead = await this.leadRepository.findById(dto.idLead);
        if (!lead) {
            throw new ActivityNotFoundException(
                `Lead con id ${dto.idLead} no encontrado`,
            );
        }

        const responsable = await this.userRepository.findById(
            dto.idResponsable,
        );
        if (!responsable) {
            throw new ActivityNotFoundException(
                `Responsable con id ${dto.idResponsable} no encontrado`,
            );
        }

        if (dto.fechaFin <= dto.fechaInicio) {
            throw new InvalidActivityDateException(
                'La fecha de inicio debe ser menor que la fecha de fin',
            );
        }

        const pending = await this.activityRepository.findPendingByLead(
            dto.idLead,
        );
        if (pending) {
            throw new PendingActivityExistsException(
                `El lead ${dto.idLead} ya tiene una actividad pendiente`,
            );
        }

        const actividad = new Actividad(
            0,
            dto.nombreActividad,
            dto.fechaInicio,
            dto.fechaFin,
            dto.tipo,
            EstadoActividad.PENDIENTE,
            dto.notas,
            null,
            false,
            null,
            false,
            dto.idLead,
            dto.idResponsable,
            new Date(),
            new Date(),
            null,
        );

        const result =
            await this.activityRepository.saveWithRelations(actividad);

        if (dto.syncWithMicrosoft) {
            await this.syncWithMicrosoft(
                result.activity,
                dto.createTeamsMeeting,
            );
        }

        return result;
    }

    /**
     * Sincroniza la actividad con Outlook/Teams. Cualquier error de Microsoft
     * se captura y registra sin afectar la creación de la actividad (RN-003).
     * Solo se ejecuta si el responsable tiene Microsoft conectado (RN-001).
     */
    private async syncWithMicrosoft(
        activity: Actividad,
        createTeamsMeeting: boolean,
    ): Promise<void> {
        try {
            const connected = await this.calendarSync.isUserConnected(
                activity.id_responsable,
            );
            if (!connected) {
                return;
            }

            const eventInput = {
                subject: activity.nombre_actividad,
                start: activity.fecha_inicio,
                end: activity.fecha_fin,
                body: activity.notas,
            };

            // Solo las REUNION con createTeamsMeeting se crean como online meeting;
            // así el evento y la reunión de Teams se obtienen en una sola llamada.
            const onlineMeeting =
                activity.tipo === TipoActividad.REUNION && createTeamsMeeting;

            const result = await this.calendarSync.createCalendarEvent(
                activity.id_responsable,
                eventInput,
                { onlineMeeting },
            );

            activity.outlook_event_id = result.outlookEventId;
            activity.teams_meeting_url = result.teamsJoinUrl;

            await this.activityRepository.save(activity);
        } catch (error) {
            this.logger.error(
                `Falló la sincronización con Microsoft para la actividad ${activity.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
