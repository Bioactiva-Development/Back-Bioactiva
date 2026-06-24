import { Global, Module } from '@nestjs/common';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

/**
 * Expone `AppTimeConfig` (zona horaria de negocio) de forma global, para que
 * cualquier módulo pueda inyectarla sin volver a declararla en sus providers.
 * `ConfigModule` ya es global, así que `AppTimeConfig` resuelve su dependencia.
 */
@Global()
@Module({
    providers: [AppTimeConfig],
    exports: [AppTimeConfig],
})
export class AppTimeModule {}
