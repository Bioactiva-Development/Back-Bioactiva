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
import { CreateActivityDto } from '@/modules/activities/application/dto/create-activity.dto';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { InvalidActivityDateException } from '@/modules/activities/domain/exceptions/invalid-activity-date.exception';
import { PendingActivityExistsException } from '@/modules/activities/domain/exceptions/pending-activity-exists.exception';

export class CreateActivityUseCase {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
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

        return await this.activityRepository.saveWithRelations(actividad);
    }
}
