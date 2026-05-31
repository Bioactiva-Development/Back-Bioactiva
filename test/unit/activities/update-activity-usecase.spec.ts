import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateActivityUseCase } from '@/modules/activities/application/use-cases/update-activity.use-case';
import { UpdateActivityDto } from '@/modules/activities/application/dto/update-activity.dto';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { InvalidActivityDateException } from '@/modules/activities/domain/exceptions/invalid-activity-date.exception';

/**
 * UpdateActivityUseCase
 * ---------------------
 * Solo actualiza campos de negocio (nombre, fechas, notas, responsable);
 * nunca estado, lead, createdAt ni deletedAt.
 * - Actualiza nombre y notas.
 * - Valida el nuevo responsable (RN-002) → ActivityNotFoundException si no existe.
 * - Reprograma fechas combinando las parciales con las actuales y exige
 *   fechaInicio < fechaFin (RN-003) → InvalidActivityDateException.
 * - Lanza ActivityNotFoundException cuando la actividad no existe.
 */
describe('Activities module', () => {
    describe('UpdateActivityUseCase', () => {
        let useCase: UpdateActivityUseCase;
        let activityRepository: any;
        let userRepository: any;

        const buildActividad = () =>
            new Actividad(
                1,
                'Llamada inicial',
                new Date('2026-06-01T10:00:00.000Z'),
                new Date('2026-06-01T11:00:00.000Z'),
                TipoActividad.LLAMADA,
                EstadoActividad.PENDIENTE,
                'Nota inicial',
                null,
                false,
                null,
                false,
                1,
                5,
                new Date(),
                new Date(),
                null,
            );

        beforeEach(() => {
            activityRepository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            userRepository = { findById: jest.fn() };
            useCase = new UpdateActivityUseCase(
                activityRepository,
                userRepository,
            );
        });

        it('should update name and notes', async () => {
            const actividad = buildActividad();
            activityRepository.findById.mockResolvedValue(actividad);
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: actividad,
            });

            const dto = new UpdateActivityDto(
                'Reunión de cierre',
                undefined,
                undefined,
                'Nueva nota',
                undefined,
            );
            await useCase.execute(1, dto);

            expect(actividad.nombre_actividad).toBe('Reunión de cierre');
            expect(actividad.notas).toBe('Nueva nota');
            expect(activityRepository.saveWithRelations).toHaveBeenCalledWith(
                actividad,
            );
        });

        it('should update responsable when provided', async () => {
            const actividad = buildActividad();
            activityRepository.findById.mockResolvedValue(actividad);
            userRepository.findById.mockResolvedValue({ id: 10 });
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: actividad,
            });

            const dto = new UpdateActivityDto(
                undefined,
                undefined,
                undefined,
                undefined,
                10,
            );
            await useCase.execute(1, dto);

            expect(actividad.id_responsable).toBe(10);
            expect(userRepository.findById).toHaveBeenCalledWith(10);
        });

        it('should reschedule when only fechaFin is provided', async () => {
            const actividad = buildActividad();
            activityRepository.findById.mockResolvedValue(actividad);
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: actividad,
            });

            const nuevaFechaFin = new Date('2026-06-01T12:00:00.000Z');
            const dto = new UpdateActivityDto(
                undefined,
                undefined,
                nuevaFechaFin,
            );
            await useCase.execute(1, dto);

            expect(actividad.fecha_fin).toEqual(nuevaFechaFin);
            expect(actividad.fecha_inicio).toEqual(
                new Date('2026-06-01T10:00:00.000Z'),
            );
        });

        it('should throw when resulting dates are invalid', async () => {
            const actividad = buildActividad();
            activityRepository.findById.mockResolvedValue(actividad);

            const dto = new UpdateActivityDto(
                undefined,
                new Date('2026-06-01T13:00:00.000Z'),
            );

            await expect(useCase.execute(1, dto)).rejects.toThrow(
                InvalidActivityDateException,
            );
            expect(activityRepository.saveWithRelations).not.toHaveBeenCalled();
        });

        it('should throw when activity is not found', async () => {
            activityRepository.findById.mockResolvedValue(null);

            await expect(
                useCase.execute(999, new UpdateActivityDto('x')),
            ).rejects.toThrow(ActivityNotFoundException);
        });

        it('should throw when new responsable does not exist', async () => {
            const actividad = buildActividad();
            activityRepository.findById.mockResolvedValue(actividad);
            userRepository.findById.mockResolvedValue(null);

            const dto = new UpdateActivityDto(
                undefined,
                undefined,
                undefined,
                undefined,
                999,
            );
            await expect(useCase.execute(1, dto)).rejects.toThrow(
                ActivityNotFoundException,
            );
        });
    });
});
