import { Injectable } from '@shared/infrastructure/dependency-inyection/inyectable';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PasswordResetNotificationPort } from '@/modules/reset_password/domain/ports/password-reset-notification.port';

export const RESET_PASSWORD_EMAIL_QUEUE = 'RESET_PASSWORD_EMAIL_QUEUE';

@Injectable()
export class PasswordResetEmailPublisher implements PasswordResetNotificationPort {
    constructor(
        @InjectQueue(RESET_PASSWORD_EMAIL_QUEUE) private readonly queue: Queue,
    ) {}

    async sendResetPasswordEmail(correo: string, token: string): Promise<void> {
        await this.queue.add(
            'send-reset-password-email',
            { correo, token },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );
    }
}
