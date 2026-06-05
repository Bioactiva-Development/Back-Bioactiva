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

describe('SunatWebScraperAdapter', () => {
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

    describe('getByRuc', () => {
        it('should return null for invalid RUC format', async () => {
            const result = await adapter.getByRuc('123');
            expect(result).toBeNull();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should return company info for valid RUC', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    ruc: '20123456789',
                    nombre: 'BIOACTIVA SAC',
                    nombreComercial: 'Bioactiva SAC',
                    tipoContribuyente: 'EMPRESA NACIONAL',
                    ubicacion: 'LIMA',
                    actividadEconomica: 'VENTA DE PRODUCTOS',
                }),
            } as FetchResult);

            const result = await adapter.getByRuc('20123456789');
            expect(result).not.toBeNull();
            expect(result?.ruc).toBe('20123456789');
            expect(result?.razonSocial).toBe('BIOACTIVA SAC');
            expect(result?.nombreComercial).toBe('Bioactiva SAC');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/consultar-ruc?ruc=20123456789'),
                expect.any(Object),
            );
        });

        it('should return null when fetch fails', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));
            expect(await adapter.getByRuc('20123456789')).toBeNull();
        });

        it('should return null when response is not ok', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503,
                json: async () => ({}),
            } as FetchResult);
            expect(await adapter.getByRuc('20123456789')).toBeNull();
        });

        it('should return null when RUC not found (404)', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({}),
            } as FetchResult);
            expect(await adapter.getByRuc('20123456789')).toBeNull();
        });

        it('should return null when response has no ruc field', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ tipoContribuyente: 'EMPRESA NACIONAL' }),
            } as FetchResult);
            expect(await adapter.getByRuc('20123456789')).toBeNull();
        });
    });

    describe('validateRuc', () => {
        it('should return false for invalid RUC format', async () => {
            expect(await adapter.validateRuc('abc')).toBe(false);
        });

        it('should return true for valid existing RUC', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    ruc: '20123456789',
                    nombre: 'BIOACTIVA SAC',
                }),
            } as FetchResult);
            expect(await adapter.validateRuc('20123456789')).toBe(true);
        });

        it('should return false when company not found', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({}),
            } as FetchResult);
            expect(await adapter.validateRuc('20123456789')).toBe(false);
        });
    });

    describe('getByRazonSocial', () => {
        it('should return companies list', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [
                    {
                        ruc: '20123456789',
                        nombre: 'EMPRESA UNO',
                        ubicacion: 'LIMA',
                    },
                    {
                        ruc: '20987654321',
                        nombre: 'EMPRESA DOS',
                        ubicacion: 'CUSCO',
                    },
                ],
            } as FetchResult);

            const results = await adapter.getByRazonSocial('EMPRESA');
            expect(results).toHaveLength(2);
            expect(results[0].razonSocial).toBe('EMPRESA UNO');
            expect(results[1].razonSocial).toBe('EMPRESA DOS');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/consultar-nombre?nombre=EMPRESA'),
                expect.any(Object),
            );
        });

        it('should leave detail fields null (only ruc/name/location are known by name)', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [
                    {
                        ruc: '20123456789',
                        nombre: 'EMPRESA UNO',
                        ubicacion: 'LIMA',
                    },
                ],
            } as FetchResult);

            const [result] = await adapter.getByRazonSocial('EMPRESA');
            expect(result.ubicacion).toBe('LIMA');
            expect(result.tipo).toBeNull();
            expect(result.tamano).toBeNull();
            expect(result.sector).toBeNull();
            expect(result.actividadEconomica).toBeNull();
        });

        it('should leave ubicacion null when not provided', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [
                    { ruc: '20123456789', nombre: 'EMPRESA UNO' },
                ],
            } as FetchResult);

            const [result] = await adapter.getByRazonSocial('EMPRESA');
            expect(result.ubicacion).toBeNull();
        });

        it('should return empty array when fetch fails', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));
            expect(await adapter.getByRazonSocial('EMPRESA')).toEqual([]);
        });

        it('should return empty array when response is not ok', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503,
                json: async () => [],
            } as FetchResult);
            expect(await adapter.getByRazonSocial('EMPRESA')).toEqual([]);
        });

        it('should return empty array when list is empty', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [],
            } as FetchResult);
            expect(await adapter.getByRazonSocial('EMPRESA')).toEqual([]);
        });

        it('should filter out results without ruc', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [
                    { nombre: 'SIN RUC', ubicacion: 'LIMA' },
                    { ruc: '20987654321', nombre: 'EMPRESA VALIDA' },
                ],
            } as FetchResult);

            const results = await adapter.getByRazonSocial('EMPRESA');
            expect(results).toHaveLength(1);
            expect(results[0].razonSocial).toBe('EMPRESA VALIDA');
        });
    });
});
