import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {
    DocumentBuilder,
    SwaggerCustomOptions,
    SwaggerModule,
} from '@nestjs/swagger';

// La app puede desplegarse en servidores con cualquier zona horaria del SO.
// Fijamos el proceso en UTC para que toda operación implícita con `Date`
// (p. ej. `setHours`, comparaciones, `Date.now()`) sea determinista y coincida
// con el almacenamiento en Prisma y el scheduling en BullMQ, que ya trabajan en
// UTC. La hora civil para el usuario se deriva siempre de forma explícita con
// `formatDateTimeInZone` según `APP_TIMEZONE` (ver AppTimeConfig), no de la zona
// del proceso.
process.env.TZ = 'UTC';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    // Swagger UI requiere estilos/scripts inline para renderizar
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    fontSrc: ["'self'", 'https:', 'data:'],
                    connectSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    frameAncestors: ["'none'"],
                },
            },
            //testing 2
            crossOriginResourcePolicy: { policy: 'cross-origin' },
        }),
    );

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
        // Permite que el frontend lea el nombre del archivo al descargar
        // exportaciones (.xlsx) vía fetch/axios; sin esto el header queda oculto
        // por CORS y el navegador no puede recuperar el filename.
        exposedHeaders: ['Content-Disposition'],
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
