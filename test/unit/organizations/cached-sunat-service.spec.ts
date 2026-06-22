import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CachedSunatService } from '@/modules/organizations/infrastructure/service/cached-sunat.service';

/**
 * CachedSunatService
 * ------------------
 * Decorator de ISunatService que cachea en Redis las consultas a SUNAT:
 * - Sirve de cache en HIT sin tocar el scraper.
 * - En MISS delega y guarda solo resultados positivos.
 * - No cachea null/[] (fallos/sin datos) ni RUCs malformados.
 */
describe('Organizations module', () => {
    describe('CachedSunatService', () => {
        let service: CachedSunatService;
        let delegate: any;
        let cache: any;

        const company = {
            ruc: '20123456789',
            razonSocial: 'ACME SAC',
            nombreComercial: 'ACME',
            tipo: null,
            ubicacion: 'LIMA',
            actividadEconomica: null,
            tamano: null,
            sector: null,
        };

        beforeEach(() => {
            delegate = {
                validateRuc: jest.fn(),
                getByRuc: jest.fn(),
                getByRazonSocial: jest.fn(),
            };
            cache = {
                get: jest.fn(),
                set: jest.fn(),
            };
            const configService = {
                get: jest.fn().mockReturnValue('3600'),
            } as any;
            service = new CachedSunatService(delegate, cache, configService);
        });

        describe('getByRuc', () => {
            it('returns the cached value without hitting the scraper', async () => {
                cache.get.mockResolvedValue(company);

                const result = await service.getByRuc('20123456789');

                expect(result).toEqual(company);
                expect(delegate.getByRuc).not.toHaveBeenCalled();
                expect(cache.set).not.toHaveBeenCalled();
            });

            it('delegates on a miss and caches a positive result', async () => {
                cache.get.mockResolvedValue(null);
                delegate.getByRuc.mockResolvedValue(company);

                const result = await service.getByRuc('20123456789');

                expect(result).toEqual(company);
                expect(cache.set).toHaveBeenCalledWith(
                    'sunat:ruc:20123456789',
                    company,
                    3600,
                );
            });

            it('does not cache a null result', async () => {
                cache.get.mockResolvedValue(null);
                delegate.getByRuc.mockResolvedValue(null);

                const result = await service.getByRuc('20123456789');

                expect(result).toBeNull();
                expect(cache.set).not.toHaveBeenCalled();
            });

            it('bypasses the cache for a malformed RUC', async () => {
                delegate.getByRuc.mockResolvedValue(null);

                await service.getByRuc('123');

                expect(cache.get).not.toHaveBeenCalled();
                expect(delegate.getByRuc).toHaveBeenCalledWith('123');
            });
        });

        describe('getByRazonSocial', () => {
            it('normalizes the key and caches a non-empty result', async () => {
                cache.get.mockResolvedValue(null);
                delegate.getByRazonSocial.mockResolvedValue([company]);

                const result = await service.getByRazonSocial('  ACME   SAC  ');

                expect(result).toEqual([company]);
                expect(cache.get).toHaveBeenCalledWith('sunat:nombre:acme sac');
                expect(cache.set).toHaveBeenCalledWith(
                    'sunat:nombre:acme sac',
                    [company],
                    3600,
                );
            });

            it('does not cache an empty result', async () => {
                cache.get.mockResolvedValue(null);
                delegate.getByRazonSocial.mockResolvedValue([]);

                const result = await service.getByRazonSocial('inexistente');

                expect(result).toEqual([]);
                expect(cache.set).not.toHaveBeenCalled();
            });

            it('returns the cached list on a hit', async () => {
                cache.get.mockResolvedValue([company]);

                const result = await service.getByRazonSocial('ACME SAC');

                expect(result).toEqual([company]);
                expect(delegate.getByRazonSocial).not.toHaveBeenCalled();
            });

            it('bypasses the cache for a blank query', async () => {
                delegate.getByRazonSocial.mockResolvedValue([]);

                await service.getByRazonSocial('   ');

                expect(cache.get).not.toHaveBeenCalled();
                expect(delegate.getByRazonSocial).toHaveBeenCalledWith('   ');
            });
        });

        describe('validateRuc', () => {
            it('is true when getByRuc resolves a company (via cache)', async () => {
                cache.get.mockResolvedValue(company);

                await expect(service.validateRuc('20123456789')).resolves.toBe(
                    true,
                );
            });

            it('is false when there is no company', async () => {
                cache.get.mockResolvedValue(null);
                delegate.getByRuc.mockResolvedValue(null);

                await expect(service.validateRuc('20123456789')).resolves.toBe(
                    false,
                );
            });
        });
    });
});
