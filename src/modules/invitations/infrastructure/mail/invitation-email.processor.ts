import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UserRole } from '@/shared/domain/enums/rol';
import { INVITATION_EMAIL_QUEUE } from '../queue/invitation-email.publisher';
import { MailService } from '@/modules/common/mail/mail.service';

@Processor(INVITATION_EMAIL_QUEUE)
export class InvitationEmailProcessor extends WorkerHost {
    constructor(private readonly mailService: MailService) {
        super();
    }

    async process(
        job: Job<{
            correo: string;
            token: string;
            rol: UserRole;
            invitedBy: number;
        }>,
    ): Promise<void> {
        if (job.name !== 'send-invitation-email') {
            return;
        }

        await this.mailService.sendInvitationEmail(job.data);
    }
}
