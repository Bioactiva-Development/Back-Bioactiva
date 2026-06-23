import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
} from '@/modules/activities/domain/ports/activity-repository.port';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { CreateActivityDto } from '@/modules/activities/application/dto/create-activity.dto';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { InvalidActivityDateException } from '@/modules/activities/domain/exceptions/invalid-activity-date.exception';
import { PendingActivityExistsException } from '@/modules/activities/domain/exceptions/pending-activity-exists.exception';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
import {
    exactTimeInZone,
    startOfCurrentDayInZone,
} from '@/shared/infrastructure/datetime/range-in-zone';

export class CreateActivityUseCase {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
        private readonly appTime: AppTimeConfig,
    ) {}

    async execute(dto: CreateActivityDto) {
        const lead = await this.leadRepository.findById(dto.idLead);
        if (!lead) {
            throw new ActivityNotFoundException(
                'El lead no fue encontrado',
            );
        }

        // El responsable de la actividad es siempre el encargado del lead
        // (regla de negocio: una actividad tiene un único responsable y es el
        // encargado del lead). No se toma de la petición.
        const idResponsable = lead.id_encargado;

        // Mantis #441: una actividad pendiente no puede programarse en el pasado.
        // Se permite la fecha actual (cualquier hora de hoy) o una fecha futura.
        // El "inicio de hoy" se calcula en la zona de negocio (APP_TIMEZONE), no
        // en la del proceso (UTC): si no, entre las 19:00 y medianoche en Lima la
        // validación se correría al día siguiente.
        const inicioDelDia = startOfCurrentDayInZone(
            new Date(),
            this.appTime.timeZone,
        );
        if (dto.fechaInicio < inicioDelDia) {
            throw new InvalidActivityDateException(
                'La fecha de la actividad no puede ser anterior a la fecha actual',
            );
        }

        if (dto.fechaFin <= dto.fechaInicio) {
            throw new InvalidActivityDateException(
                'La fecha de inicio debe ser menor que la fecha de fin',
            );
        }

        const ahora = exactTimeInZone(new Date(), this.appTime.timeZone);
        if (dto.fechaFin < ahora) {
            throw new InvalidActivityDateException(
                'La fecha de fin de la actividad no puede ser anterior al momento actual',
            );
        }

        const pending = await this.activityRepository.findPendingByLead(
            dto.idLead,
        );
        if (pending) {
            throw new PendingActivityExistsException(
                'El lead ya tiene una actividad pendiente',
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
            idResponsable,
            new Date(),
            new Date(),
            null,
        );

        // El evento de Outlook/Teams ya no se crea aquí: se programa de forma
        // explícita desde el Calendario (CreateActivityCalendarEventUseCase),
        // según CU007 (pasos 83-90).
        return this.activityRepository.saveWithRelations(actividad);
    }
}
