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

export class CompleteActivityUseCase {
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

        activity.markCompleted();

        const saved = await this.activityRepository.saveWithRelations(activity);

        // CU007: completar la actividad cancela el seguimiento externo pendiente.
        await this.followUpCanceler.onActivityCompleted(id);

        return saved;
    }
}
