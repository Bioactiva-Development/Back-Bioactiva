import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import {
    InvitationEmailPublisher,
    INVITATION_EMAIL_QUEUE,
} from './invitation-email.publisher';
import { InvitationEmailProcessor } from '../mail/invitation-email.processor';
import { MailService } from '../mail/mail.service';

@Module({
    imports: [
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
    ],
    providers: [
        InvitationEmailPublisher,
        InvitationEmailProcessor,
        MailService,
    ],
    exports: [InvitationEmailPublisher],
})
export class InvitationEmailQueueModule {}
