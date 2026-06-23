import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
} from '@/modules/activities/domain/ports/activity-repository.port';
import {
    FOLLOW_UP_CANCELER,
    type FollowUpCancelerPort,
} from '@/modules/activities/domain/ports/follow-up-canceler.port';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { InvalidActivityTransitionException } from '@/modules/activities/domain/exceptions/invalid-activity-transition.exception';

export class DeleteActivityUseCase {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
        @Inject(FOLLOW_UP_CANCELER)
        private readonly followUpCanceler: FollowUpCancelerPort,
    ) {}

    async execute(id: number) {
        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new ActivityNotFoundException(
                'La actividad no fue encontrada',
            );
        }

        if (activity.estado !== EstadoActividad.PENDIENTE) {
            throw new InvalidActivityTransitionException(
                'Solo se pueden eliminar actividades pendientes',
            );
        }

        activity.markAsDeleted();
        await this.activityRepository.save(activity);

        await this.followUpCanceler.onActivityDeleted(id);

        return { ok: true };
    }
}
