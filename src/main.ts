import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    app.enableCors({
        origin: process.env.FRONTEND_BIOACTIVA || 'http://localhost:4000',
        credentials: true,
    });

    app.use(cookieParser());
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true, // Convierte los payloads al tipo de objeto del DTO
            disableErrorMessages: false, // Cambia a true si no quieres mostrar detalles del error en producción
            whitelist: true, // Elimina propiedades del objeto que no estén en el DTO
            forbidNonWhitelisted: true, // Lanza un error si envían propiedades no permitidas
        }),
    );
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
