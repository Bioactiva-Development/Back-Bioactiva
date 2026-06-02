import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
} from '@/modules/activities/domain/ports/activity-repository.port';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

export class GetActivityByIdUseCase {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
    ) {}

    async execute(id: number) {
        const activity =
            await this.activityRepository.findByIdWithRelations(id);
        if (!activity) {
            throw new ActivityNotFoundException(
                `Actividad con id ${id} no encontrada`,
            );
        }
        return activity;
    }
}
