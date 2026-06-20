import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ResetService } from '@/modules/reset/application/reset.service';

/**
 * ResetService
 * ------------
 * Trunca todas las tablas del esquema y reinicializa los datos de admin.
 */
describe('Reset module', () => {
    describe('ResetService', () => {
        let prismaService: any;
        let adminInitializer: any;
        let service: ResetService;

        beforeEach(() => {
            prismaService = {
                $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
            };
            adminInitializer = {
                initializeData: jest.fn().mockResolvedValue(undefined),
            };
            service = new ResetService(prismaService, adminInitializer);
        });

        it('truncates all tables and re-initializes admin data', async () => {
            await service.resetDatabase();

            expect(prismaService.$executeRawUnsafe).toHaveBeenCalledTimes(1);
            const sql = prismaService.$executeRawUnsafe.mock.calls[0][0];
            expect(sql).toContain('TRUNCATE TABLE');
            expect(sql).toContain('RESTART IDENTITY CASCADE');
            expect(sql).toContain('"Usuario"');
            expect(sql).toContain('"Lead"');
            expect(adminInitializer.initializeData).toHaveBeenCalledTimes(1);
        });

        it('propagates errors from the truncate query', async () => {
            prismaService.$executeRawUnsafe.mockRejectedValue(
                new Error('db down'),
            );

            await expect(service.resetDatabase()).rejects.toThrow('db down');
            expect(adminInitializer.initializeData).not.toHaveBeenCalled();
        });
    });
});
