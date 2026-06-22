import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockGet = jest.fn();
const mockSet = jest.fn();
const mockQuit = jest.fn();
const mockDisconnect = jest.fn();
const mockOn = jest.fn();

jest.mock('ioredis', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        get: mockGet,
        set: mockSet,
        quit: mockQuit,
        disconnect: mockDisconnect,
        on: mockOn,
    })),
}));

import { RedisCacheService } from '@/modules/common/cache/redis-cache.service';

/**
 * RedisCacheService
 * -----------------
 * Adapter de CachePort sobre ioredis. Verifica serialización JSON con TTL, el
 * miss (clave ausente) y la resiliencia: si Redis falla, get => null y set => no-op.
 */
describe('Common module', () => {
    describe('RedisCacheService', () => {
        let service: RedisCacheService;
        const configService = {
            getOrThrow: jest.fn().mockReturnValue('redis://localhost:6379'),
        } as any;

        beforeEach(() => {
            mockGet.mockReset();
            mockSet.mockReset();
            mockQuit.mockReset();
            mockDisconnect.mockReset();
            mockOn.mockReset();
            service = new RedisCacheService(configService);
        });

        it('registers an error listener to avoid unhandled errors', () => {
            expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
        });

        it('logs without throwing when the error listener fires', () => {
            const handler = mockOn.mock.calls.find(
                (call) => call[0] === 'error',
            )?.[1] as (error: Error) => void;

            expect(() => handler(new Error('ECONNREFUSED'))).not.toThrow();
        });

        it('parses a stored JSON value on get', async () => {
            mockGet.mockResolvedValue(JSON.stringify({ ruc: '20123456789' }));

            await expect(service.get('sunat:ruc:20123456789')).resolves.toEqual(
                { ruc: '20123456789' },
            );
        });

        it('returns null when the key is absent', async () => {
            mockGet.mockResolvedValue(null);

            await expect(service.get('missing')).resolves.toBeNull();
        });

        it('returns null (miss) when Redis throws on get', async () => {
            mockGet.mockRejectedValue(new Error('connection refused'));

            await expect(service.get('x')).resolves.toBeNull();
        });

        it('returns null when Redis throws a non-Error value on get', async () => {
            mockGet.mockRejectedValue('weird');

            await expect(service.get('x')).resolves.toBeNull();
        });

        it('serializes the value with an EX ttl on set', async () => {
            mockSet.mockResolvedValue('OK');

            await service.set('k', { a: 1 }, 3600);

            expect(mockSet).toHaveBeenCalledWith(
                'k',
                JSON.stringify({ a: 1 }),
                'EX',
                3600,
            );
        });

        it('swallows errors on set', async () => {
            mockSet.mockRejectedValue(new Error('down'));

            await expect(
                service.set('k', { a: 1 }, 60),
            ).resolves.toBeUndefined();
        });

        it('swallows non-Error throwables on set', async () => {
            mockSet.mockRejectedValue('weird');

            await expect(
                service.set('k', { a: 1 }, 60),
            ).resolves.toBeUndefined();
        });

        it('quits the client on module destroy', async () => {
            mockQuit.mockResolvedValue('OK');

            await service.onModuleDestroy();

            expect(mockQuit).toHaveBeenCalledTimes(1);
        });

        it('force-disconnects if quit fails on destroy', async () => {
            mockQuit.mockRejectedValue(new Error('cannot quit'));

            await service.onModuleDestroy();

            expect(mockDisconnect).toHaveBeenCalledTimes(1);
        });
    });
});
