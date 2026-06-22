import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    type ISunatService,
    SunatCompanyInfo,
} from '@/modules/organizations/domain/ports/sunat.service';
import { SunatWebScraperAdapter } from '@/modules/organizations/infrastructure/service/sunat-web-scraper.adapter';
import {
    CACHE_SERVICE,
    type CachePort,
} from '@/modules/common/cache/cache.port';

/**
 * Decorator de ISunatService que cachea en Redis las consultas recientes a SUNAT
 * para no golpear el microservicio scraper (cada consulta por RUC/nombre puede
 * tardar decenas de segundos) en búsquedas repetidas.
 *
 * Solo se cachean resultados POSITIVOS: el scraper devuelve `null`/`[]` tanto
 * cuando no hay datos como cuando falla (timeout, caído), y cachear esos casos
 * congelaría un fallo transitorio como si fuera "no existe".
 */
@Injectable()
export class CachedSunatService implements ISunatService {
    private readonly logger = new Logger(CachedSunatService.name);
    private readonly ttlSeconds: number;

    constructor(
        private readonly delegate: SunatWebScraperAdapter,
        @Inject(CACHE_SERVICE) private readonly cache: CachePort,
        configService: ConfigService,
    ) {
        // Por defecto 24h: los datos de RUC/razón social son muy estables, así
        // que un TTL amplio maximiza los aciertos sin servir datos obsoletos.
        this.ttlSeconds = Number(
            configService.get<string>('SUNAT_CACHE_TTL_SECONDS', '86400'),
        );
    }

    async validateRuc(ruc: string): Promise<boolean> {
        const company = await this.getByRuc(ruc);
        return company !== null;
    }

    async getByRuc(ruc: string): Promise<SunatCompanyInfo | null> {
        // RUCs malformados no llegan al scraper ni a la cache; se delega para
        // conservar la validación de formato del adapter base.
        if (!/^\d{11}$/.test(ruc)) {
            return this.delegate.getByRuc(ruc);
        }

        const key = `sunat:ruc:${ruc}`;
        const cached = await this.cache.get<SunatCompanyInfo>(key);
        if (cached) {
            return cached;
        }

        const result = await this.delegate.getByRuc(ruc);
        if (result) {
            await this.cache.set(key, result, this.ttlSeconds);
        }
        return result;
    }

    async getByRazonSocial(razonSocial: string): Promise<SunatCompanyInfo[]> {
        const normalized = razonSocial.trim().toLowerCase().replace(/\s+/g, ' ');
        if (!normalized) {
            return this.delegate.getByRazonSocial(razonSocial);
        }

        const key = `sunat:nombre:${normalized}`;
        const cached = await this.cache.get<SunatCompanyInfo[]>(key);
        if (cached) {
            return cached;
        }

        const result = await this.delegate.getByRazonSocial(razonSocial);
        if (result.length > 0) {
            await this.cache.set(key, result, this.ttlSeconds);
        }
        return result;
    }
}
