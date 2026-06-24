import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { MailModule } from '@/modules/common/mail/mail.module';
import { RedisModule } from '@/modules/common/redis/redis.module';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
import { FOLLOW_UP_CANCELER } from '@/modules/activities/domain/ports/follow-up-canceler.port';
import { NOTIFICATION_REPOSITORY } from '@/modules/notifications/domain/ports/notification-repository.port';
import { NOTIFICATION_SCHEDULER } from '@/modules/notifications/domain/ports/notification-scheduler.port';
import { EMAIL_TEMPLATE_READER } from '@/modules/notifications/domain/ports/email-template-reader.port';
import { EMAIL_TEMPLATE_REPOSITORY } from '@/modules/notifications/domain/ports/email-template-repository.port';
import { NOTIFICATION_MAILER } from '@/modules/notifications/domain/ports/notification-mailer.port';
import { ACTIVITY_CONTEXT_READER } from '@/modules/notifications/domain/ports/activity-context-reader.port';
import { STALE_LEAD_READER } from '@/modules/notifications/domain/ports/stale-lead-reader.port';
import { IN_APP_NOTIFICATION_REPOSITORY } from '@/modules/notifications/domain/ports/in-app-notification-repository.port';
import { PrismaNotificationRepository } from '@/modules/notifications/infrastructure/persistance/prisma-notification.repository';
import { PrismaEmailTemplateReader } from '@/modules/notifications/infrastructure/persistance/prisma-email-template-reader';
import { PrismaEmailTemplateRepository } from '@/modules/notifications/infrastructure/persistance/prisma-email-template.repository';
import { PrismaActivityContextReader } from '@/modules/notifications/infrastructure/persistance/prisma-activity-context-reader';
import { PrismaStaleLeadReader } from '@/modules/notifications/infrastructure/persistance/prisma-stale-lead-reader';
import { PrismaInAppNotificationRepository } from '@/modules/notifications/infrastructure/persistance/prisma-in-app-notification.repository';
import {
    NotificationSchedulerPublisher,
    NOTIFICATIONS_QUEUE,
} from '@/modules/notifications/infrastructure/queue/notification-scheduler.publisher';
import { NotificationProcessor } from '@/modules/notifications/infrastructure/queue/notification.processor';
import {
    StaleLeadAlertScheduler,
    STALE_LEAD_ALERTS_QUEUE,
} from '@/modules/notifications/infrastructure/queue/stale-lead-alert.scheduler';
import { StaleLeadAlertProcessor } from '@/modules/notifications/infrastructure/queue/stale-lead-alert.processor';
import { NotificationMailerAdapter } from '@/modules/notifications/infrastructure/mail/notification-mailer.adapter';
import { ActivityCompletionAdapter } from '@/modules/notifications/infrastructure/activities/activity-completion.adapter';
import { NotificationsController } from '@/modules/notifications/infrastructure/http/notifications.controller';
import { TemplatesController } from '@/modules/notifications/infrastructure/http/templates.controller';
import { CreateReminderUseCase } from '@/modules/notifications/application/use-cases/create-reminder.use-case';
import { CreateFollowUpUseCase } from '@/modules/notifications/application/use-cases/create-follow-up.use-case';
import { EditFollowUpUseCase } from '@/modules/notifications/application/use-cases/edit-follow-up.use-case';
import { CancelNotificationUseCase } from '@/modules/notifications/application/use-cases/cancel-notification.use-case';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { ListActiveTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-active-templates.use-case';
import { CompleteActivityFollowUpUseCase } from '@/modules/notifications/application/use-cases/complete-activity-follow-up.use-case';
import { CancelActivityNotificationsUseCase } from '@/modules/notifications/application/use-cases/cancel-activity-notifications.use-case';
import { SendInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-internal-email.use-case';
import { SendInstanceInternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-instance-internal-email.use-case';
import { SendInstanceExternalEmailUseCase } from '@/modules/notifications/application/use-cases/send-instance-external-email.use-case';
import { GenerateStaleLeadAlertsUseCase } from '@/modules/notifications/application/use-cases/generate-stale-lead-alerts.use-case';
import { ListInAppNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-in-app-notifications.use-case';
import { MarkInAppNotificationReadUseCase } from '@/modules/notifications/application/use-cases/mark-in-app-notification-read.use-case';
import { CreateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/create-email-template.use-case';
import { UpdateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/update-email-template.use-case';
import { GetEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/get-email-template.use-case';
import { ListEmailTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-email-templates.use-case';
import { DeleteEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/delete-email-template.use-case';

@Module({
    imports: [
        PrismaModule,
        MailModule,
        RedisModule,
        BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
        BullModule.registerQueue({ name: STALE_LEAD_ALERTS_QUEUE }),
    ],
    controllers: [NotificationsController, TemplatesController],
    providers: [
        AppTimeConfig,
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
        PrismaEmailTemplateRepository,
        {
            provide: EMAIL_TEMPLATE_REPOSITORY,
            useExisting: PrismaEmailTemplateRepository,
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
        PrismaStaleLeadReader,
        { provide: STALE_LEAD_READER, useExisting: PrismaStaleLeadReader },
        PrismaInAppNotificationRepository,
        {
            provide: IN_APP_NOTIFICATION_REPOSITORY,
            useExisting: PrismaInAppNotificationRepository,
        },
        CreateReminderUseCase,
        CreateFollowUpUseCase,
        EditFollowUpUseCase,
        CancelNotificationUseCase,
        ListNotificationsUseCase,
        ListActiveTemplatesUseCase,
        CompleteActivityFollowUpUseCase,
        CancelActivityNotificationsUseCase,
        SendInternalEmailUseCase,
        SendInstanceInternalEmailUseCase,
        SendInstanceExternalEmailUseCase,
        GenerateStaleLeadAlertsUseCase,
        ListInAppNotificationsUseCase,
        MarkInAppNotificationReadUseCase,
        CreateEmailTemplateUseCase,
        UpdateEmailTemplateUseCase,
        GetEmailTemplateUseCase,
        ListEmailTemplatesUseCase,
        DeleteEmailTemplateUseCase,
        NotificationProcessor,
        StaleLeadAlertScheduler,
        StaleLeadAlertProcessor,
        ActivityCompletionAdapter,
        { provide: FOLLOW_UP_CANCELER, useExisting: ActivityCompletionAdapter },
    ],
    exports: [FOLLOW_UP_CANCELER, IN_APP_NOTIFICATION_REPOSITORY],
})
export class NotificationsModule {}
