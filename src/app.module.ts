import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpLoggingInterceptor } from '@/shared/interceptors/http-logging.interceptor';

@Module({
    imports: [],
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
