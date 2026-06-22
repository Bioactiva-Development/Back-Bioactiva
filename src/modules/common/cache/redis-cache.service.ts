import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CachePort } from '@/modules/common/cache/cache.port';

/**
 * Implementación de CachePort sobre ioredis con una conexión dedicada (separada
 * de la de BullMQ).
 *
 * Resiliencia: la cache es un optimizador, no una dependencia dura. Por eso:
 *  - `enableOfflineQueue: false` hace que los comandos fallen rápido si Redis no
 *    está disponible, en vez de quedar encolados y bloquear la petición.
 *  - tanto `get` como `set` atrapan cualquier error y lo degradan a miss/no-op,
 *    de modo que un Redis caído nunca rompe la búsqueda en SUNAT.
 */
@Injectable()
export class RedisCacheService implements CachePort, OnModuleDestroy {
    private readonly logger = new Logger(RedisCacheService.name);
    private readonly client: Redis;

    constructor(configService: ConfigService) {
        this.client = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            lazyConnect: false,
        });
        // ioredis emite 'error' de forma asíncrona; sin listener, un fallo de
        // conexión se convertiría en un unhandled error que tumba el proceso.
        this.client.on('error', (error: Error) => {
            this.logger.warn(`Conexión Redis (cache) con error: ${error.message}`);
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const raw = await this.client.get(key);
            return raw ? (JSON.parse(raw) as T) : null;
        } catch (error) {
            this.logger.warn(
                `Cache get falló para ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        try {
            await this.client.set(
                key,
                JSON.stringify(value),
                'EX',
                ttlSeconds,
            );
        } catch (error) {
            this.logger.warn(
                `Cache set falló para ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.client.quit();
        } catch {
            this.client.disconnect();
        }
    }
}
