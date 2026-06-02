import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { SunatWebScraperAdapter } from '@/modules/organizations/infrastructure/service/sunat-web-scraper.adapter';

type FetchResult = { ok: boolean; json: () => Promise<any> };

describe('SunatWebScraperAdapter', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>;
    const originalFetch = global.fetch;
    let adapter: SunatWebScraperAdapter;

    beforeEach(() => {
        mockFetch = jest.fn<typeof fetch>();
        global.fetch = mockFetch as any;
        adapter = new SunatWebScraperAdapter();
    });

    afterEach(() => {
        global.fetch = originalFetch;
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
                    resultados: [{
                        ruc: '20123456789',
                        tipo_contribuyente: 'EMPRESA NACIONAL',
                        nombre_comercial: 'Bioactiva SAC',
                        domicilio_fiscal: 'LIMA',
                        actividad_economica: 'VENTA DE PRODUCTOS',
                    }],
                }),
            } as FetchResult);

            const result = await adapter.getByRuc('20123456789');
            expect(result).not.toBeNull();
            expect(result?.ruc).toBe('20123456789');
            expect(result?.razonSocial).toBe('');
            expect(result?.nombreComercial).toBe('Bioactiva SAC');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/consulta-ruc/20123456789'),
                expect.any(Object),
            );
        });

        it('should return null when fetch fails', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            const result = await adapter.getByRuc('20123456789');
            expect(result).toBeNull();
        });

        it('should return null when response is not ok', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                json: async () => ({}),
            } as FetchResult);

            const result = await adapter.getByRuc('20123456789');
            expect(result).toBeNull();
        });

        it('should return null when resultados is empty', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resultados: [] }),
            } as FetchResult);

            const result = await adapter.getByRuc('20123456789');
            expect(result).toBeNull();
        });

        it('should handle RUC with format "digits - razonSocial"', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    resultados: [{
                        ruc: '20123456789 - BIOACTIVA SAC',
                        tipo_contribuyente: 'EMPRESA NACIONAL',
                    }],
                }),
            } as FetchResult);

            const result = await adapter.getByRuc('20123456789');
            expect(result?.ruc).toBe('20123456789');
            expect(result?.razonSocial).toBe('BIOACTIVA SAC');
        });

        it('should handle scraper error response', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    resultados: [{
                        ruc: '20123456789',
                        error: 'Error en consulta',
                    }],
                }),
            } as FetchResult);

            const result = await adapter.getByRuc('20123456789');
            expect(result).toBeNull();
        });

        it('should handle missing ruc field in response', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    resultados: [{
                        tipo_contribuyente: 'EMPRESA NACIONAL',
                    }],
                }),
            } as FetchResult);

            const result = await adapter.getByRuc('20123456789');
            expect(result).toBeNull();
        });

        it('should handle resultados not being an array', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resultados: 'invalid' }),
            } as FetchResult);

            const result = await adapter.getByRuc('20123456789');
            expect(result).toBeNull();
        });
    });

    describe('validateRuc', () => {
        it('should return false for invalid RUC format', async () => {
            const result = await adapter.validateRuc('abc');
            expect(result).toBe(false);
        });

        it('should return true for valid existing RUC', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    resultados: [{
                        ruc: '20123456789',
                        tipo_contribuyente: 'EMPRESA NACIONAL',
                    }],
                }),
            } as FetchResult);

            const result = await adapter.validateRuc('20123456789');
            expect(result).toBe(true);
        });

        it('should return false when company not found', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resultados: [] }),
            } as FetchResult);

            const result = await adapter.validateRuc('20123456789');
            expect(result).toBe(false);
        });
    });

    describe('getByRazonSocial', () => {
        it('should return companies list', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    resultados: [
                        { ruc: '20123456789 - EMPRESA UNO', tipo_contribuyente: 'EMPRESA NACIONAL' },
                        { ruc: '20987654321 - EMPRESA DOS', tipo_contribuyente: 'PERSONA NATURAL' },
                    ],
                }),
            } as FetchResult);

            const results = await adapter.getByRazonSocial('EMPRESA');
            expect(results).toHaveLength(2);
            expect(results[0].razonSocial).toBe('EMPRESA UNO');
            expect(results[1].razonSocial).toBe('EMPRESA DOS');
        });

        it('should return empty array when fetch fails', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            const results = await adapter.getByRazonSocial('EMPRESA');
            expect(results).toEqual([]);
        });

        it('should return empty array when response is not ok', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                json: async () => ({}),
            } as FetchResult);

            const results = await adapter.getByRazonSocial('EMPRESA');
            expect(results).toEqual([]);
        });

        it('should return empty array when resultados is empty', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ resultados: [] }),
            } as FetchResult);

            const results = await adapter.getByRazonSocial('EMPRESA');
            expect(results).toEqual([]);
        });

        it('should filter out errored results', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    resultados: [
                        { ruc: '20123456789', error: 'Error', tipo_contribuyente: 'EMPRESA NACIONAL' },
                        { ruc: '20987654321 - EMPRESA VALIDA', tipo_contribuyente: 'PERSONA NATURAL' },
                    ],
                }),
            } as FetchResult);

            const results = await adapter.getByRazonSocial('EMPRESA');
            expect(results).toHaveLength(1);
            expect(results[0].razonSocial).toBe('EMPRESA VALIDA');
        });
    });
});
