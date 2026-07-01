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

    // CSP estricta para toda la API: sin 'unsafe-inline' en script-src (la API
    // solo devuelve JSON, no ejecuta scripts propios). Así CSP Evaluator no marca
    // el riesgo alto de scripts inline en las respuestas reales del backend.
    const strictCspDirectives = {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
    };

    app.use(
        helmet({
            contentSecurityPolicy: { directives: strictCspDirectives },
            crossOriginResourcePolicy: { policy: 'cross-origin' },
        }),
    );

    // Swagger UI sí necesita scripts/estilos inline para renderizar. Se relaja la
    // CSP SOLO en sus rutas (y debe registrarse antes de SwaggerModule.setup para
    // que corra antes del handler de la ruta). El resto de la API queda estricta.
    app.use(
        ['/swagger', '/swagger-json'],
        helmet.contentSecurityPolicy({
            directives: {
                ...strictCspDirectives,
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
                imgSrc: ["'self'", 'data:', 'https:'],
                fontSrc: ["'self'", 'https:', 'data:'],
            },
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
        process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
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
