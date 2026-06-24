import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockPoolEnd = jest.fn();
const mockPoolOn = jest.fn();
const poolConstructorCalls: any[] = [];

jest.mock('@prisma/client', () => ({
    PrismaClient: class {
        $connect = mockConnect;
        $disconnect = mockDisconnect;
        constructor(..._args: unknown[]) {}
    },
}));

jest.mock('@prisma/adapter-pg', () => ({
    PrismaPg: jest.fn().mockImplementation((pool: unknown, opts: any) => ({
        pool,
        opts,
    })),
}));

jest.mock('pg', () => ({
    Pool: jest.fn().mockImplementation((config: unknown) => {
        poolConstructorCalls.push(config);
        return {
            on: mockPoolOn,
            end: mockPoolEnd,
        };
    }),
}));

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * PrismaService (ciclo de vida y pool compartido)
 * -----------------------------------------------
 * Cubre la creación del pool singleton, los hooks onModuleInit/onModuleDestroy
 * y el drenaje del pool. Las dependencias nativas (PrismaClient, adapter, pg)
 * están mockeadas para poder instanciar sin DB real.
 */
describe('Common module', () => {
    describe('PrismaService lifecycle', () => {
        const loadFresh = () => {
            let mod: any;
            jest.isolateModules(() => {
                mod = require('@/modules/common/prisma/prisma.service');
            });
            return mod.PrismaService;
        };

        beforeEach(() => {
            mockConnect.mockReset().mockResolvedValue(undefined);
            mockDisconnect.mockReset().mockResolvedValue(undefined);
            mockPoolEnd.mockReset().mockResolvedValue(undefined);
            mockPoolOn.mockReset();
            poolConstructorCalls.length = 0;
            (Pool as unknown as jest.Mock).mockClear();
            (PrismaPg as unknown as jest.Mock).mockClear();
            delete (globalThis as any).__bioactivaPgPool;
            process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
        });

        it('throws when DATABASE_URL is not defined', () => {
            delete process.env.DATABASE_URL;
            const PrismaService = loadFresh();
            expect(() => new PrismaService()).toThrow('DATABASE_URL');
        });

        it('wires adapter onPoolError/onConnectionError callbacks', () => {
            const PrismaService = loadFresh();
            new PrismaService();

            const adapterOpts = (PrismaPg as unknown as jest.Mock).mock
                .calls[0][1];
            // Los callbacks solo loguean; deben ejecutarse sin lanzar.
            expect(() =>
                adapterOpts.onPoolError(new Error('pool boom')),
            ).not.toThrow();
            expect(() =>
                adapterOpts.onConnectionError(new Error('conn boom')),
            ).not.toThrow();
        });

        it('creates the pool with defaults and registers an error listener', () => {
            const PrismaService = loadFresh();
            new PrismaService();

            expect(Pool).toHaveBeenCalledTimes(1);
            const config = poolConstructorCalls[0];
            expect(config.max).toBe(5);
            expect(config.application_name).toContain('bioactiva-backend-');
            expect(mockPoolOn).toHaveBeenCalledWith(
                'error',
                expect.any(Function),
            );

            // El listener de error no debe lanzar (solo loguea).
            const errorHandler = mockPoolOn.mock.calls[0][1] as (
                err: Error,
            ) => void;
            expect(() =>
                errorHandler(new Error('idle conn down')),
            ).not.toThrow();
        });

        it('honors pool env overrides', () => {
            process.env.DATABASE_POOL_MAX = '12';
            process.env.DATABASE_APP_NAME = 'custom-app';
            const PrismaService = loadFresh();
            new PrismaService();

            expect(poolConstructorCalls[0].max).toBe(12);
            expect(poolConstructorCalls[0].application_name).toBe('custom-app');

            delete process.env.DATABASE_POOL_MAX;
            delete process.env.DATABASE_APP_NAME;
        });

        it('reuses the existing singleton pool across constructions', () => {
            const PrismaService = loadFresh();
            new PrismaService();
            new PrismaService();

            expect(Pool).toHaveBeenCalledTimes(1);
        });

        it('onModuleInit connects to the database', async () => {
            const PrismaService = loadFresh();
            const service = new PrismaService();

            await service.onModuleInit();

            expect(mockConnect).toHaveBeenCalledTimes(1);
        });

        it('onModuleDestroy disconnects and drains the pool', async () => {
            const PrismaService = loadFresh();
            const service = new PrismaService();

            await service.onModuleDestroy();

            expect(mockDisconnect).toHaveBeenCalledTimes(1);
            expect(mockPoolEnd).toHaveBeenCalledTimes(1);
            expect((globalThis as any).__bioactivaPgPool).toBeUndefined();
        });

        it('onModuleDestroy skips pool drain when there is no pool', async () => {
            const PrismaService = loadFresh();
            const service = new PrismaService();
            // Simula que el pool ya fue limpiado por otro contexto.
            delete (globalThis as any).__bioactivaPgPool;

            await service.onModuleDestroy();

            expect(mockDisconnect).toHaveBeenCalledTimes(1);
            expect(mockPoolEnd).not.toHaveBeenCalled();
        });
    });
});
