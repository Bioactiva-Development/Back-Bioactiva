import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { MailModule } from '@/modules/common/mail/mail.module';
import { RedisModule } from '@/modules/common/redis/redis.module';
import { FOLLOW_UP_CANCELER } from '@/modules/activities/domain/ports/follow-up-canceler.port';
import { NOTIFICATION_REPOSITORY } from '@/modules/notifications/domain/ports/notification-repository.port';
import { NOTIFICATION_SCHEDULER } from '@/modules/notifications/domain/ports/notification-scheduler.port';
import { EMAIL_TEMPLATE_READER } from '@/modules/notifications/domain/ports/email-template-reader.port';
import { NOTIFICATION_MAILER } from '@/modules/notifications/domain/ports/notification-mailer.port';
import { ACTIVITY_CONTEXT_READER } from '@/modules/notifications/domain/ports/activity-context-reader.port';
import { PrismaNotificationRepository } from '@/modules/notifications/infrastructure/persistance/prisma-notification.repository';
import { PrismaEmailTemplateReader } from '@/modules/notifications/infrastructure/persistance/prisma-email-template-reader';
import { PrismaActivityContextReader } from '@/modules/notifications/infrastructure/persistance/prisma-activity-context-reader';
import {
    NotificationSchedulerPublisher,
    NOTIFICATIONS_QUEUE,
} from '@/modules/notifications/infrastructure/queue/notification-scheduler.publisher';
import { NotificationProcessor } from '@/modules/notifications/infrastructure/queue/notification.processor';
import { NotificationMailerAdapter } from '@/modules/notifications/infrastructure/mail/notification-mailer.adapter';
import { ActivityCompletionAdapter } from '@/modules/notifications/infrastructure/activities/activity-completion.adapter';
import { NotificationsController } from '@/modules/notifications/infrastructure/http/notifications.controller';
import { CreateReminderUseCase } from '@/modules/notifications/application/use-cases/create-reminder.use-case';
import { CreateFollowUpUseCase } from '@/modules/notifications/application/use-cases/create-follow-up.use-case';
import { CancelNotificationUseCase } from '@/modules/notifications/application/use-cases/cancel-notification.use-case';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { ListActiveTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-active-templates.use-case';
import { CompleteActivityFollowUpUseCase } from '@/modules/notifications/application/use-cases/complete-activity-follow-up.use-case';
import { SendInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-internal-email.use-case';
import { SendExternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-external-email.use-case';

@Module({
    imports: [
        PrismaModule,
        MailModule,
        RedisModule,
        BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
    ],
    controllers: [NotificationsController],
    providers: [
        PrismaNotificationRepository,
        {
            provide: NOTIFICATION_REPOSITORY,
            useExisting: PrismaNotificationRepository,
        },
        PrismaEmailTemplateReader,
        {
            provide: EMAIL_TEMPLATE_READER,
            useExisting: PrismaEmailTemplateReader,
        },
        PrismaActivityContextReader,
        {
            provide: ACTIVITY_CONTEXT_READER,
            useExisting: PrismaActivityContextReader,
        },
        NotificationSchedulerPublisher,
        {
            provide: NOTIFICATION_SCHEDULER,
            useExisting: NotificationSchedulerPublisher,
        },
        NotificationMailerAdapter,
        {
            provide: NOTIFICATION_MAILER,
            useExisting: NotificationMailerAdapter,
        },
        CreateReminderUseCase,
        CreateFollowUpUseCase,
        CancelNotificationUseCase,
        ListNotificationsUseCase,
        ListActiveTemplatesUseCase,
        CompleteActivityFollowUpUseCase,
        SendInternalEmailUseCase,
        SendExternalEmailUseCase,
        NotificationProcessor,
        ActivityCompletionAdapter,
        { provide: FOLLOW_UP_CANCELER, useExisting: ActivityCompletionAdapter },
    ],
    exports: [FOLLOW_UP_CANCELER],
})
export class NotificationsModule {}
