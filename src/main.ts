import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

import { DomainExceptionFilter } from '@/shared/infrastructure/filters';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Middleware para cookies
    app.use(cookieParser());

    // Validaciones globales de DTOs
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            disableErrorMessages: false,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    // Filtro global de excepciones de dominio
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
