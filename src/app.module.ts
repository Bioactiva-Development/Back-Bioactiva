import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpLoggingInterceptor } from '@/shared/interceptors/http-logging.interceptor';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '@/modules/users/user.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { ContactsModule } from '@/modules/contacts/contacts.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UsersModule,
        OrganizationsModule,
        ContactsModule,

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
    ],
})
export class AppModule {}
