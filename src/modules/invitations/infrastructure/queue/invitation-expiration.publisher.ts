import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InvitationExpirationSchedulerPort } from '@/modules/invitations/domain/port/invitation-expiration-scheduler.port';

export const INVITATION_EXPIRATION_QUEUE = 'INVITATION_EXPIRATION_QUEUE';

@Injectable()
export class InvitationExpirationPublisher implements InvitationExpirationSchedulerPort {
    constructor(
        @InjectQueue(INVITATION_EXPIRATION_QUEUE) private readonly queue: Queue,
    ) {}

    async scheduleExpiration(input: {
        invitationId: number;
        expiresAt: Date;
    }): Promise<void> {
        const delay = Math.max(0, input.expiresAt.getTime() - Date.now());

        await this.queue.add(
            'expire-invitation',
            {
                invitationId: input.invitationId,
            },
            {
                jobId: `expire-invitation:${input.invitationId}`,
                delay,
                attempts: 1,
                removeOnComplete: true,
                removeOnFail: false,
            },
        );
    }
}
