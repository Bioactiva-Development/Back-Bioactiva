import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    ACTIVITY_REPOSITORY,
    type ActivityRepository,
} from '@/modules/activities/domain/ports/activity-repository.port';
import { ListActivitiesDto } from '@/modules/activities/application/dto/list-activities.dto';

export class ListActivitiesUseCase {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: ActivityRepository,
    ) {}

    async execute(dto: ListActivitiesDto) {
        const { page, limit, ...filters } = dto;
        const [data, total] = await Promise.all([
            this.activityRepository.list({ ...filters, page, limit }),
            this.activityRepository.count(filters),
        ]);
        return { data, total };
    }
}
