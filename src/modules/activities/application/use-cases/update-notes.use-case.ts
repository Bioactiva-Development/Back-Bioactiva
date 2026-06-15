import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
} from '@/modules/activities/domain/ports/activity-repository.port';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';

export class UpdateNotesUseCase {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
    ) {}

    async execute(id: number, notas: string) {
        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new ActivityNotFoundException(
                `Actividad con id ${id} no encontrada`,
            );
        }
        activity.notas = notas;
        return await this.activityRepository.saveWithRelations(activity);
    }
}
