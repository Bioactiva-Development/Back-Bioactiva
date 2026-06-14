import { Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { ActivityController } from '@/modules/activities/infrastructure/http/activity.controller';
import { PrismaActivityRepository } from '@/modules/activities/infrastructure/persistance/prisma-activity.repository';
import { ACTIVITY_REPOSITORY } from '@/modules/activities/domain/ports/activity-repository.port';
import { LeadsModule } from '@/modules/leads/leads.module';
import { UsersModule } from '@/modules/users/user.module';
import { MicrosoftIntegrationModule } from '@/modules/integrations/microsoft-integration.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { CreateActivityUseCase } from '@/modules/activities/application/use-cases/create-activity.use-case';
import { CreateActivityCalendarEventUseCase } from '@/modules/activities/application/use-cases/create-activity-calendar-event.use-case';
import { GetActivityByIdUseCase } from '@/modules/activities/application/use-cases/get-activity-by-id.use-case';
import { ListActivitiesUseCase } from '@/modules/activities/application/use-cases/list-activities.use-case';
import { UpdateActivityUseCase } from '@/modules/activities/application/use-cases/update-activity.use-case';
import { CompleteActivityUseCase } from '@/modules/activities/application/use-cases/complete-activity.use-case';
import { CancelActivityUseCase } from '@/modules/activities/application/use-cases/cancel-activity.use-case';
import { DeleteActivityUseCase } from '@/modules/activities/application/use-cases/delete-activity.use-case';

@Module({
    imports: [
        PrismaModule,
        LeadsModule,
        UsersModule,
        MicrosoftIntegrationModule,
        NotificationsModule,
    ],
    controllers: [ActivityController],
    providers: [
        PrismaActivityRepository,
        {
            provide: ACTIVITY_REPOSITORY,
            useExisting: PrismaActivityRepository,
        },
        CreateActivityUseCase,
        CreateActivityCalendarEventUseCase,
        GetActivityByIdUseCase,
        ListActivitiesUseCase,
        UpdateActivityUseCase,
        CompleteActivityUseCase,
        CancelActivityUseCase,
        DeleteActivityUseCase,
    ],
})
export class ActivitiesModule {}
