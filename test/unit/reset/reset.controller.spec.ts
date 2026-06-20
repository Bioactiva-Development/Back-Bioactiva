import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ImATeapotException } from '@nestjs/common';
import { ResetController } from '@/modules/reset/infrastructure/http/reset.controller';

/**
 * ResetController
 * ---------------
 * Endpoint protegido por la query `?confirm=true`. Sin confirmación devuelve 418.
 */
describe('Reset module', () => {
    describe('ResetController', () => {
        let resetService: any;
        let controller: ResetController;

        beforeEach(() => {
            resetService = {
                resetDatabase: jest.fn().mockResolvedValue(undefined),
            };
            controller = new ResetController(resetService);
        });

        it('resets the database when confirm=true', async () => {
            const result = await controller.resetDatabase('true');

            expect(resetService.resetDatabase).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                message: 'Base de datos reiniciada exitosamente',
            });
        });

        it('throws ImATeapotException when confirm is not "true"', async () => {
            await expect(controller.resetDatabase('false')).rejects.toThrow(
                ImATeapotException,
            );
            expect(resetService.resetDatabase).not.toHaveBeenCalled();
        });

        it('throws ImATeapotException when confirm is missing', async () => {
            await expect(
                controller.resetDatabase(undefined as unknown as string),
            ).rejects.toThrow(ImATeapotException);
        });
    });
});
