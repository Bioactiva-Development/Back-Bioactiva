import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExpirePasswordResetTokenUseCase } from '@/modules/reset_password/application/use-cases/expire-password-reset-token.use-case';
import { RESET_PASSWORD_EXPIRATION_QUEUE } from './password-reset-expiration.publisher';

@Injectable()
@Processor(RESET_PASSWORD_EXPIRATION_QUEUE)
export class PasswordResetExpirationProcessor extends WorkerHost {
    private readonly logger = new Logger(PasswordResetExpirationProcessor.name);

    constructor(
        private readonly expirePasswordResetTokenUseCase: ExpirePasswordResetTokenUseCase,
    ) {
        super();
    }

    async process(job: Job<{ resetTokenId: number }>): Promise<void> {
        if (job.name !== 'expire-password-reset-token') {
            return;
        }

        const expired = await this.expirePasswordResetTokenUseCase.execute(
            job.data.resetTokenId,
        );

        if (!expired) {
            this.logger.debug(
                `Password reset token ${job.data.resetTokenId} was already handled before scheduled expiration`,
            );
        }
    }
}
