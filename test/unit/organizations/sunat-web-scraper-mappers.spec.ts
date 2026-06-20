import {
    describe,
    expect,
    it,
    jest,
    beforeEach,
    afterEach,
} from '@jest/globals';
import { SunatWebScraperAdapter } from '@/modules/organizations/infrastructure/service/sunat-web-scraper.adapter';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

type FetchResult = { ok: boolean; status?: number; json: () => Promise<any> };

// Cubre los mapeadores privados mapEnterpriseType / mapSector que sólo se
// ejercitan al recibir los campos `tipo` y `sector` en la consulta por RUC.
describe('SunatWebScraperAdapter mappers (tipo/sector)', () => {
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

    const mockRucResponse = (overrides: Record<string, unknown>) => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                ruc: '20123456789',
                nombre: 'EMPRESA TEST',
                ...overrides,
            }),
        } as FetchResult);
    };

    it('should map a known tipo (case-insensitive) to its EnterpriseType', async () => {
        mockRucResponse({ tipo: 'ong' });
        const result = await adapter.getByRuc('20123456789');
        expect(result?.tipo).toBe(EnterpriseType.ONG);
    });

    it('should default to EMPRESA_NACIONAL for an unknown tipo', async () => {
        mockRucResponse({ tipo: 'DESCONOCIDO' });
        const result = await adapter.getByRuc('20123456789');
        expect(result?.tipo).toBe(EnterpriseType.EMPRESA_NACIONAL);
    });

    it('should default to EMPRESA_NACIONAL when tipo is null', async () => {
        mockRucResponse({ tipo: null });
        const result = await adapter.getByRuc('20123456789');
        expect(result?.tipo).toBe(EnterpriseType.EMPRESA_NACIONAL);
    });

    it('should map a known sector (case-insensitive) to its Sector', async () => {
        mockRucResponse({ sector: 'tecnologia' });
        const result = await adapter.getByRuc('20123456789');
        expect(result?.sector).toBe(Sector.TECNOLOGIA);
    });

    it('should map an unknown sector to null', async () => {
        mockRucResponse({ sector: 'DESCONOCIDO' });
        const result = await adapter.getByRuc('20123456789');
        expect(result?.sector).toBeNull();
    });

    it('should map a missing sector to null', async () => {
        mockRucResponse({ sector: null });
        const result = await adapter.getByRuc('20123456789');
        expect(result?.sector).toBeNull();
        // El tamaño siempre se fija en MICRO desde la consulta por RUC.
        expect(result?.tamano).toBe(Size.MICRO);
    });
});
