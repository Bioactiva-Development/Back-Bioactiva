import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

/**
 * Conexión raíz de BullMQ/Redis, centralizada y global.
 *
 * Antes cada módulo de cola registraba su propia `BullModule.forRootAsync`, lo
 * que provocaba conexiones duplicadas/inconsistentes. Aquí se define una sola
 * raíz que todos los módulos de cola reutilizan importando `RedisModule`.
 *
 * NOTA / limitación conocida: el factory descompone `REDIS_URL` en
 * host/port/password manualmente, por lo que NO soporta:
 *   - TLS (`rediss://`): no se establece la opción `tls`.
 *   - Índice de base de datos en el path (`/0`, `/1`, ...): se ignora.
 *   - Usuario distinto del implícito `default` (sólo se usa la contraseña).
 * Todos los entornos actuales usan `redis://` con db 0 y usuario `default`, así
 * que esto no afecta hoy. Si en el futuro se usa Redis gestionado con TLS u otra
 * db, hay que extender este factory (o pasar la `url` completa a la conexión).
 */
@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const redisUrl = new URL(configService.getOrThrow<string>('REDIS_URL'));
                return {
                    connection: {
                        host: redisUrl.hostname,
                        port: Number(redisUrl.port),
                        password: redisUrl.password
                            ? decodeURIComponent(redisUrl.password)
                            : undefined,
                    },
                };
            },
        }),
    ],
    exports: [BullModule],
})
export class RedisModule {}
