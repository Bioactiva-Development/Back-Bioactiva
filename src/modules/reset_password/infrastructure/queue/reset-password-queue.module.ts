import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from '@/modules/common/mail/mail.module';
import {
    PasswordResetEmailPublisher,
    RESET_PASSWORD_EMAIL_QUEUE,
} from './password-reset-email.publisher';
import {
    PasswordResetExpirationPublisher,
    RESET_PASSWORD_EXPIRATION_QUEUE,
} from './password-reset-expiration.publisher';
import { PasswordResetEmailProcessor } from '../mail/password-reset-email.processor';
import { PasswordResetExpirationProcessor } from './password-reset-expiration.processor';
import { ResetPasswordModule } from '../../reset-password.module';

@Module({
    imports: [
        MailModule,
        forwardRef(() => ResetPasswordModule),
        BullModule.registerQueue({
            name: RESET_PASSWORD_EMAIL_QUEUE,
        }),
        BullModule.registerQueue({
            name: RESET_PASSWORD_EXPIRATION_QUEUE,
        }),
    ],
    providers: [
        PasswordResetEmailPublisher,
        PasswordResetEmailProcessor,
        PasswordResetExpirationPublisher,
        PasswordResetExpirationProcessor,
    ],
    exports: [PasswordResetEmailPublisher, PasswordResetExpirationPublisher],
})
export class ResetPasswordQueueModule {}
