import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateNotesUseCase } from '@/modules/activities/application/use-cases/update-notes.use-case';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

/**
 * UpdateNotesUseCase
 * ------------------
 * Actualiza solo las notas de una actividad existente y devuelve la actividad
 * enriquecida. Lanza ActivityNotFoundException cuando la actividad no existe.
 */
describe('Activities module', () => {
    describe('UpdateNotesUseCase', () => {
        let useCase: UpdateNotesUseCase;
        let activityRepository: any;

        const buildActividad = () =>
            new Actividad(
                1,
                'Llamada inicial',
                new Date('2026-06-01T10:00:00.000Z'),
                new Date('2026-06-01T11:00:00.000Z'),
                TipoActividad.LLAMADA,
                EstadoActividad.PENDIENTE,
                'Notas viejas',
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
                saveWithRelations: jest.fn(),
            };
            useCase = new UpdateNotesUseCase(activityRepository);
        });

        it('should update notes and return the enriched activity', async () => {
            const activity = buildActividad();
            const enriched = {
                activity,
                leadServicioInteres: 'Consultoría',
                leadEstado: 'EN_PROSPECTO',
                responsableNombre: 'Carlos',
                responsableApellidos: 'López',
            };
            activityRepository.findById.mockResolvedValue(activity);
            activityRepository.saveWithRelations.mockResolvedValue(enriched);

            const result = await useCase.execute(1, 'Notas nuevas');

            expect(activity.notas).toBe('Notas nuevas');
            expect(activityRepository.findById).toHaveBeenCalledWith(1);
            expect(activityRepository.saveWithRelations).toHaveBeenCalledWith(
                activity,
            );
            expect(result).toBe(enriched);
        });

        it('should throw ActivityNotFoundException when activity does not exist', async () => {
            activityRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(99, 'Notas')).rejects.toThrow(
                ActivityNotFoundException,
            );
            expect(activityRepository.saveWithRelations).not.toHaveBeenCalled();
        });
    });
});
