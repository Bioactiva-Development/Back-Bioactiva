import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import {
    DocumentBuilder,
    SwaggerCustomOptions,
    SwaggerModule,
} from '@nestjs/swagger';

import { DomainExceptionFilter } from '@/shared/infrastructure/filters';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const config = new DocumentBuilder()
        .setTitle('API de Bioactiva')
        .setDescription('Documentación de la API de Bioactiva')
        .setVersion('1.0')
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
        })
        .build();
    const option: SwaggerCustomOptions = {
        jsonDocumentUrl: '/swagger-json',
    };

    const document = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document(), option);

    const allowedOrigin =
        process.env.FRONTEND_URL?.trim() || 'http://localhost:3120';
    app.enableCors({
        origin: allowedOrigin,
        credentials: true,
    });

    app.use(cookieParser());
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            disableErrorMessages: false,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    app.useGlobalFilters(new DomainExceptionFilter());

    app.useLogger(logger);

    const port = Number(process.env.PORT ?? 3000);

    await app.listen(port);

    logger.log(`Application running on http://localhost:${port}`);
    logger.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
});
