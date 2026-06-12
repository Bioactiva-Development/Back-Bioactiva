import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RESET_PASSWORD_EMAIL_QUEUE } from '../queue/password-reset-email.publisher';
import { MailService } from '@/modules/common/mail/mail.service';

@Processor(RESET_PASSWORD_EMAIL_QUEUE)
export class PasswordResetEmailProcessor extends WorkerHost {
    constructor(private readonly mailService: MailService) {
        super();
    }

    async process(
        job: Job<{
            correo: string;
            token: string;
        }>,
    ): Promise<void> {
        if (job.name !== 'send-reset-password-email') {
            return;
        }

        await this.mailService.sendResetPasswordEmail(job.data);
    }
}
