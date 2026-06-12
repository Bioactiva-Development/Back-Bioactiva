import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
    InvitationEmailPublisher,
    INVITATION_EMAIL_QUEUE,
} from './invitation-email.publisher';
import { InvitationEmailProcessor } from '../mail/invitation-email.processor';
import {
    InvitationExpirationPublisher,
    INVITATION_EXPIRATION_QUEUE,
} from './invitation-expiration.publisher';
import { InvitationExpirationProcessor } from '../mail/invitation-expiration.processor';
import { MailModule } from '@/modules/common/mail/mail.module';
import { RedisModule } from '@/modules/common/redis/redis.module';
import { InvitationsModule } from '@/modules/invitations/invitations.module';

@Module({
    imports: [
        MailModule,
        RedisModule,
        forwardRef(() => InvitationsModule),
        BullModule.registerQueue({
            name: INVITATION_EMAIL_QUEUE,
        }),
        BullModule.registerQueue({
            name: INVITATION_EXPIRATION_QUEUE,
        }),
    ],
    providers: [
        InvitationEmailPublisher,
        InvitationEmailProcessor,
        InvitationExpirationPublisher,
        InvitationExpirationProcessor,
    ],
    exports: [InvitationEmailPublisher, InvitationExpirationPublisher],
})
export class InvitationEmailQueueModule {}
