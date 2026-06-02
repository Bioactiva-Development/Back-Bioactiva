import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DeleteActivityUseCase } from '@/modules/activities/application/use-cases/delete-activity.use-case';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

/**
 * DeleteActivityUseCase
 * ---------------------
 * Eliminación lógica, nunca física.
 * - Marca deletedAt vía markAsDeleted(), persiste con save() y devuelve { ok: true }.
 * - Lanza ActivityNotFoundException cuando la actividad no existe.
 */
describe('Activities module', () => {
    describe('DeleteActivityUseCase', () => {
        let useCase: DeleteActivityUseCase;
        let activityRepository: any;

        const buildActividad = () =>
            new Actividad(
                1,
                'Llamada',
                new Date('2026-06-01T10:00:00.000Z'),
                new Date('2026-06-01T11:00:00.000Z'),
                TipoActividad.LLAMADA,
                EstadoActividad.PENDIENTE,
                null,
                null,
                false,
                null,
                false,
                1,
                1,
                new Date(),
                new Date(),
                null,
            );

        beforeEach(() => {
            activityRepository = {
                findById: jest.fn(),
                save: jest.fn(),
            };
            useCase = new DeleteActivityUseCase(activityRepository);
        });

        it('should soft delete an activity', async () => {
            const actividad = buildActividad();
            activityRepository.findById.mockResolvedValue(actividad);
            activityRepository.save.mockResolvedValue(actividad);

            const result = await useCase.execute(1);

            expect(actividad.deleted_at).toBeInstanceOf(Date);
            expect(activityRepository.save).toHaveBeenCalledWith(actividad);
            expect(result).toEqual({ ok: true });
        });

        it('should throw when activity is not found', async () => {
            activityRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toThrow(
                ActivityNotFoundException,
            );
        });
    });
});
