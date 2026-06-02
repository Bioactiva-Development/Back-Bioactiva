import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ListActivitiesUseCase } from '@/modules/activities/application/use-cases/list-activities.use-case';
import { ListActivitiesDto } from '@/modules/activities/application/dto/list-activities.dto';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';

/**
 * ListActivitiesUseCase
 * ---------------------
 * - Devuelve { data, total } combinando list() y count().
 * - Aplica la paginación por defecto (page 1, limit 10) cuando no se envía.
 * - Propaga los filtros (idLead, idResponsable, estado, tipo, rango de fechas)
 *   tanto a list() como a count().
 */
describe('Activities module', () => {
    describe('ListActivitiesUseCase', () => {
        let useCase: ListActivitiesUseCase;
        let activityRepository: any;

        beforeEach(() => {
            activityRepository = {
                list: jest.fn(),
                count: jest.fn(),
            };
            useCase = new ListActivitiesUseCase(activityRepository);
        });

        it('should return paginated results', async () => {
            const mockData = [{ activity: { id: 1 } }];
            activityRepository.list.mockResolvedValue(mockData);
            activityRepository.count.mockResolvedValue(1);

            const dto = new ListActivitiesDto();
            const result = await useCase.execute(dto);

            expect(result.data).toEqual(mockData);
            expect(result.total).toBe(1);
            expect(activityRepository.list).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
            });
            expect(activityRepository.count).toHaveBeenCalledWith({});
        });

        it('should pass filters to repository', async () => {
            activityRepository.list.mockResolvedValue([]);
            activityRepository.count.mockResolvedValue(0);

            const fechaInicio = new Date('2026-06-01T00:00:00.000Z');
            const fechaFin = new Date('2026-06-30T23:59:59.000Z');
            const dto = new ListActivitiesDto(
                1,
                5,
                EstadoActividad.PENDIENTE,
                TipoActividad.LLAMADA,
                fechaInicio,
                fechaFin,
                2,
                20,
            );
            await useCase.execute(dto);

            expect(activityRepository.list).toHaveBeenCalledWith({
                idLead: 1,
                idResponsable: 5,
                estado: EstadoActividad.PENDIENTE,
                tipo: TipoActividad.LLAMADA,
                fechaInicio,
                fechaFin,
                page: 2,
                limit: 20,
            });
            expect(activityRepository.count).toHaveBeenCalledWith({
                idLead: 1,
                idResponsable: 5,
                estado: EstadoActividad.PENDIENTE,
                tipo: TipoActividad.LLAMADA,
                fechaInicio,
                fechaFin,
            });
        });
    });
});
