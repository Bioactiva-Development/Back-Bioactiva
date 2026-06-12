import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export const PRISMA_SERVICE = 'PRISMA_SERVICE' as const;

const logger = new Logger('PrismaPool');

/**
 * Singleton a nivel de proceso para el pool de conexiones de Postgres.
 *
 * Garantiza que exista un único `pg.Pool` aunque `PrismaService` se construya
 * más de una vez (hot-reload en watch mode, múltiples contextos de Nest en
 * tests/e2e, etc.). Sin esto, cada construcción abría un pool nuevo sin límite
 * de conexiones, agotando `max_connections` del servidor y produciendo el error
 * "Too many database connections opened: too many clients already".
 */
const globalForPrisma = globalThis as unknown as {
    __bioactivaPgPool?: Pool;
};

function getPgPool(): Pool {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL no está definida');
    }

    if (!globalForPrisma.__bioactivaPgPool) {
        // El servidor Postgres es compartido entre entornos (dev/test apuntan al
        // mismo host) y tiene un `max_connections` limitado. Por eso el pool se
        // mantiene pequeño por defecto: el cupo del servidor se reparte entre
        // todos los procesos conectados, no es exclusivo de esta instancia.
        const max = Number(process.env.DATABASE_POOL_MAX ?? 5);
        const appName =
            process.env.DATABASE_APP_NAME ??
            `bioactiva-backend-${process.env.NODE_ENV ?? 'dev'}`;

        globalForPrisma.__bioactivaPgPool = new Pool({
            connectionString: databaseUrl,
            max,
            // Libera conexiones inactivas rápido para devolver cupo al servidor.
            idleTimeoutMillis: Number(
                process.env.DATABASE_POOL_IDLE_MS ?? 10_000,
            ),
            // Si no hay slot libre en `connectionTimeoutMillis`, falla rápido en
            // lugar de quedar colgado indefinidamente esperando una conexión.
            connectionTimeoutMillis: Number(
                process.env.DATABASE_POOL_CONN_TIMEOUT_MS ?? 10_000,
            ),
            // Recicla cada conexión tras N usos para evitar conexiones longevas
            // que el servidor pueda considerar zombis tras reinicios del backend.
            maxUses: Number(process.env.DATABASE_POOL_MAX_USES ?? 7_500),
            // Identifica nuestras conexiones en `pg_stat_activity`, lo que permite
            // diagnosticar y cerrar conexiones colgadas con pg_terminate_backend.
            application_name: appName,
            // Evita que una sesión quede "idle in transaction" reteniendo cupo.
            idle_in_transaction_session_timeout: Number(
                process.env.DATABASE_IDLE_TX_TIMEOUT_MS ?? 30_000,
            ),
        });

        // Errores emitidos por conexiones inactivas del pool (p. ej. el servidor
        // corta la conexión). Sin este listener, `pg` lanzaría un error no
        // capturado capaz de tumbar el proceso.
        globalForPrisma.__bioactivaPgPool.on('error', (err) => {
            logger.error(`Error en conexión inactiva del pool: ${err.message}`);
        });

        logger.log(
            `Pool de Postgres inicializado (max=${max}, application_name=${appName})`,
        );
    }

    return globalForPrisma.__bioactivaPgPool;
}

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        const pool = getPgPool();
        // `disposeExternalPool: false` -> Prisma no cierra el pool compartido al
        // hacer `$disconnect()`; su ciclo de vida lo gestiona este servicio.
        const adapter = new PrismaPg(pool, {
            disposeExternalPool: false,
            onPoolError: (err) =>
                this.logger.error(`Error en el pool: ${err.message}`),
            onConnectionError: (err) =>
                this.logger.error(`Error de conexión: ${err.message}`),
        });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Conexión a la base de datos establecida');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        // Drena el pool compartido y limpia el singleton para que un reinicio
        // del contexto (p. ej. e2e) cree un pool limpio en vez de reutilizar uno
        // ya cerrado.
        if (globalForPrisma.__bioactivaPgPool) {
            await globalForPrisma.__bioactivaPgPool.end();
            globalForPrisma.__bioactivaPgPool = undefined;
            this.logger.log('Pool de Postgres drenado');
        }
    }
}
