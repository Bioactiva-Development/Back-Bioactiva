import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetActivityByIdUseCase } from '@/modules/activities/application/use-cases/get-activity-by-id.use-case';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

/**
 * GetActivityByIdUseCase
 * ----------------------
 * - Devuelve la actividad con relaciones (lead y responsable) cuando existe.
 * - Lanza ActivityNotFoundException cuando no existe o está eliminada
 *   (el repositorio excluye los registros con deletedAt).
 */
describe('Activities module', () => {
    describe('GetActivityByIdUseCase', () => {
        let useCase: GetActivityByIdUseCase;
        let activityRepository: any;

        beforeEach(() => {
            activityRepository = {
                findByIdWithRelations: jest.fn(),
            };
            useCase = new GetActivityByIdUseCase(activityRepository);
        });

        it('should return activity when found', async () => {
            const expected = { activity: { id: 1 }, leadServicioInteres: 'X' };
            activityRepository.findByIdWithRelations.mockResolvedValue(
                expected,
            );

            const result = await useCase.execute(1);

            expect(result).toBe(expected);
            expect(
                activityRepository.findByIdWithRelations,
            ).toHaveBeenCalledWith(1);
        });

        it('should throw when activity is not found', async () => {
            activityRepository.findByIdWithRelations.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toThrow(
                ActivityNotFoundException,
            );
        });
    });
});
