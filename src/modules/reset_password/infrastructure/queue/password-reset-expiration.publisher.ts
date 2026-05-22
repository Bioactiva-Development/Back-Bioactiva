import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PasswordResetExpirationSchedulerPort } from '@/modules/reset_password/domain/ports/password-reset-expiration-scheduler.port';

export const RESET_PASSWORD_EXPIRATION_QUEUE =
    'RESET_PASSWORD_EXPIRATION_QUEUE';

@Injectable()
export class PasswordResetExpirationPublisher implements PasswordResetExpirationSchedulerPort {
    constructor(
        @InjectQueue(RESET_PASSWORD_EXPIRATION_QUEUE)
        private readonly queue: Queue,
    ) {}

    async scheduleExpiration(input: {
        resetTokenId: number;
        expiresAt: Date;
    }): Promise<void> {
        const delay = Math.max(0, input.expiresAt.getTime() - Date.now());

        await this.queue.add(
            'expire-password-reset-token',
            {
                resetTokenId: input.resetTokenId,
            },
            {
                jobId: `expire-password-reset-${input.resetTokenId}`,
                delay,
                attempts: 1,
                removeOnComplete: true,
                removeOnFail: false,
            },
        );
    }
}
