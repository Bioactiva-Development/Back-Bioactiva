import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
} from '@/modules/activities/domain/ports/activity-repository.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { UpdateActivityDto } from '@/modules/activities/application/dto/update-activity.dto';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

export class UpdateActivityUseCase {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(id: number, dto: UpdateActivityDto) {
        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new ActivityNotFoundException(
                `Actividad con id ${id} no encontrada`,
            );
        }

        if (dto.idResponsable !== undefined) {
            const responsable = await this.userRepository.findById(
                dto.idResponsable,
            );
            if (!responsable) {
                throw new ActivityNotFoundException(
                    `Responsable con id ${dto.idResponsable} no encontrado`,
                );
            }
            activity.id_responsable = dto.idResponsable;
        }

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

        return await this.activityRepository.saveWithRelations(activity);
    }
}
