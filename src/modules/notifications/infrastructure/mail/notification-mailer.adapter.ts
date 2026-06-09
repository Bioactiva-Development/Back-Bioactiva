import { Injectable } from '@nestjs/common';
import { MailService } from '@/modules/common/mail/mail.service';
import { NotificationMailerPort } from '@/modules/notifications/domain/ports/notification-mailer.port';

@Injectable()
export class NotificationMailerAdapter implements NotificationMailerPort {
    constructor(private readonly mailService: MailService) {}

    async send(input: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void> {
        await this.mailService.sendGenericEmail(input);
    }
}
