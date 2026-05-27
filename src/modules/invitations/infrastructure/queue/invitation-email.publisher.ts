import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InvitationNotificationPort } from '@/modules/invitations/domain/port/invitation-notification.port';
import { UserRole } from '@/shared/domain/enums/rol';

export const INVITATION_EMAIL_QUEUE = 'INVITATION_EMAIL_QUEUE';

@Injectable()
export class InvitationEmailPublisher implements InvitationNotificationPort {
    constructor(
        @InjectQueue(INVITATION_EMAIL_QUEUE) private readonly queue: Queue,
    ) {}

    async enqueueInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        await this.queue.add('send-invitation-email', input, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
    }
}
