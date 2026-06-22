import { Global, Module } from '@nestjs/common';
import { CACHE_SERVICE } from '@/modules/common/cache/cache.port';
import { RedisCacheService } from '@/modules/common/cache/redis-cache.service';

/**
 * Expone un CachePort (Redis) de forma global para que cualquier módulo pueda
 * inyectar CACHE_SERVICE sin volver a configurar la conexión.
 */
@Global()
@Module({
    providers: [
        RedisCacheService,
        {
            provide: CACHE_SERVICE,
            useExisting: RedisCacheService,
        },
    ],
    exports: [CACHE_SERVICE],
})
export class CacheModule {}
