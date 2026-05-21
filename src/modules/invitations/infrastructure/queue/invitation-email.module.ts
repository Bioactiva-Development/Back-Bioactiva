import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
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
import { InvitationsModule } from '@/modules/invitations/invitations.module';

@Module({
    imports: [
        MailModule,
        forwardRef(() => InvitationsModule),
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host:
                        configService.get<string>('REDIS_HOST') ?? 'localhost',
                    port: Number(
                        configService.get<string>('REDIS_PORT') ?? 6379,
                    ),
                    password:
                        configService.get<string>('REDIS_PASSWORD') ||
                        undefined,
                },
            }),
        }),
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
