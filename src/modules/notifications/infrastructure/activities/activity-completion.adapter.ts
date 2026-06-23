import { Injectable } from '@nestjs/common';
import { FollowUpCancelerPort } from '@/modules/activities/domain/ports/follow-up-canceler.port';
import { CompleteActivityFollowUpUseCase } from '@/modules/notifications/application/use-cases/complete-activity-follow-up.use-case';
import { CancelActivityNotificationsUseCase } from '@/modules/notifications/application/use-cases/cancel-activity-notifications.use-case';

@Injectable()
export class ActivityCompletionAdapter implements FollowUpCancelerPort {
    constructor(
        private readonly completeActivityFollowUpUseCase: CompleteActivityFollowUpUseCase,
        private readonly cancelActivityNotificationsUseCase: CancelActivityNotificationsUseCase,
    ) {}

    async onActivityCompleted(idActividad: number): Promise<void> {
        await this.completeActivityFollowUpUseCase.execute(idActividad);
    }

    async onActivityDeleted(idActividad: number): Promise<void> {
        await this.cancelActivityNotificationsUseCase.execute(idActividad);
    }
}
