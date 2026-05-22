import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from '@/modules/common/mail/mail.module';
import {
    PasswordResetEmailPublisher,
    RESET_PASSWORD_EMAIL_QUEUE,
} from './password-reset-email.publisher';
import { PasswordResetEmailProcessor } from '../mail/password-reset-email.processor';
import { ResetPasswordModule } from '../../reset-password.module';

@Module({
    imports: [
        MailModule,
        forwardRef(() => ResetPasswordModule),
        BullModule.registerQueue({
            name: RESET_PASSWORD_EMAIL_QUEUE,
        }),
    ],
    providers: [PasswordResetEmailPublisher, PasswordResetEmailProcessor],
    exports: [PasswordResetEmailPublisher],
})
export class ResetPasswordQueueModule {}
