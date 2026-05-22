import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExpireInvitationUseCase } from '@/modules/invitations/application/use-cases/expire-invitation.use-case';
import { INVITATION_EXPIRATION_QUEUE } from '@/modules/invitations/infrastructure/queue/invitation-expiration.publisher';

@Injectable()
@Processor(INVITATION_EXPIRATION_QUEUE)
export class InvitationExpirationProcessor extends WorkerHost {
    private readonly logger = new Logger(InvitationExpirationProcessor.name);

    constructor(
        private readonly expireInvitationUseCase: ExpireInvitationUseCase,
    ) {
        super();
    }

    async process(job: Job<{ invitationId: number }>): Promise<void> {
        if (job.name !== 'expire-invitation') {
            return;
        }

        const expired = await this.expireInvitationUseCase.execute(
            job.data.invitationId,
        );

        if (!expired) {
            this.logger.debug(
                `Invitation ${job.data.invitationId} was already handled before scheduled expiration`,
            );
        }
    }
}
