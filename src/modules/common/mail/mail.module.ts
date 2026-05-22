import { GraphMailProvider } from '@/modules/common/mail/graph-mail.provider';
import { MailService } from '@/modules/common/mail/mail.service';
import { MockMailProvider } from '@/modules/common/mail/mock-mail.provider';
import { SmtpMailProvider } from '@/modules/common/mail/smtp-mail.provider';
import { Module } from '@nestjs/common';

@Module({
    providers: [
        MockMailProvider,
        SmtpMailProvider,
        GraphMailProvider,
        MailService,
    ],
    exports: [MailService],
})
export class MailModule {}
