import {
    describe,
    expect,
    it,
    jest,
    beforeEach,
    afterEach,
} from '@jest/globals';
import { SunatWebScraperAdapter } from '@/modules/organizations/infrastructure/service/sunat-web-scraper.adapter';

type FetchResult = { ok: boolean; status?: number; json: () => Promise<any> };

/**
 * Branch coverage extra:
 *  - getByRuc / getByRazonSocial: el catch usa `String(error)` cuando fetch
 *    rechaza con un valor que NO es Error.
 *  - mapRucResponseToCompany: `res.nombre ?? ''` y
 *    `res.nombreComercial ?? res.nombre ?? ''` cuando faltan ambos.
 *  - mapNombreResultToCompany: `res.nombre ?? ''` cuando falta nombre.
 */
describe('SunatWebScraperAdapter — branches2', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>;
    const originalFetch = global.fetch;
    const originalUrl = process.env.PYTHON_SCRAPER_URL;
    let adapter: SunatWebScraperAdapter;

    beforeEach(() => {
        process.env.PYTHON_SCRAPER_URL = 'http://scraper:8000';
        mockFetch = jest.fn<typeof fetch>();
        global.fetch = mockFetch;
        adapter = new SunatWebScraperAdapter();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        process.env.PYTHON_SCRAPER_URL = originalUrl;
    });

    it('getByRuc returns null and stringifies a non-Error rejection', async () => {
        mockFetch.mockRejectedValue('explosion');
        const result = await adapter.getByRuc('20123456789');
        expect(result).toBeNull();
    });

    it('getByRazonSocial returns [] and stringifies a non-Error rejection', async () => {
        mockFetch.mockRejectedValue('explosion');
        const result = await adapter.getByRazonSocial('Bioactiva');
        expect(result).toEqual([]);
    });

    it('getByRuc defaults razonSocial and nombreComercial when both are missing', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                ruc: '20123456789',
                // sin nombre ni nombreComercial
            }),
        } as FetchResult);

        const result = await adapter.getByRuc('20123456789');
        expect(result).not.toBeNull();
        expect(result?.razonSocial).toBe('');
        expect(result?.nombreComercial).toBe('');
    });

    it('getByRazonSocial defaults names to empty string when nombre is missing', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [
                {
                    ruc: '20123456789',
                    // sin nombre
                    ubicacion: 'LIMA',
                },
            ],
        } as FetchResult);

        const result = await adapter.getByRazonSocial('Bioactiva');
        expect(result).toHaveLength(1);
        expect(result[0].razonSocial).toBe('');
        expect(result[0].nombreComercial).toBe('');
    });
});
