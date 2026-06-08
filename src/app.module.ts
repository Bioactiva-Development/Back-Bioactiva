import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpLoggingInterceptor } from '@/shared/interceptors/http-logging.interceptor';
import { GlobalExceptionFilter } from '@/shared/infrastructure/filters/global-exception.filter';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '@/modules/users/user.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { ContactsModule } from '@/modules/contacts/contacts.module';
import { InvitationsModule } from '@/modules/invitations/invitations.module';
import { ResetPasswordModule } from '@/modules/reset_password/reset-password.module';
import { LeadsModule } from '@/modules/leads/leads.module';
import { ActivitiesModule } from '@/modules/activities/activities.module';
import { MicrosoftIntegrationModule } from '@/modules/integrations/microsoft-integration.module';
import { CotizacionesModule } from '@/modules/quotations/cotizaciones.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { ResetModule } from '@/modules/reset/reset.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UsersModule,
        OrganizationsModule,
        ContactsModule,
        InvitationsModule,
        ResetPasswordModule,
        LeadsModule,
        ActivitiesModule,
        MicrosoftIntegrationModule,
        CotizacionesModule,
        DashboardModule,
        ResetModule,

        ConfigModule.forRoot({
            isGlobal: true,
        }),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: HttpLoggingInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {}
