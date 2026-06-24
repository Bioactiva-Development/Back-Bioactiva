import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateActivityUseCase } from '@/modules/activities/application/use-cases/create-activity.use-case';
import { CreateActivityDto } from '@/modules/activities/application/dto/create-activity.dto';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { InvalidActivityDateException } from '@/modules/activities/domain/exceptions/invalid-activity-date.exception';
import { PendingActivityExistsException } from '@/modules/activities/domain/exceptions/pending-activity-exists.exception';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

/**
 * CreateActivityUseCase
 * ---------------------
 * Verifica las validaciones de creación con repositorios mockeados:
 * - Lead existente y no eliminado (RN-001) → si no, ActivityNotFoundException.
 * - El responsable es SIEMPRE el encargado del lead (no se elige): se deriva de
 *   lead.id_encargado, no de la petición.
 * - fechaInicio < fechaFin (RN-003) → InvalidActivityDateException.
 * - Sin actividad PENDIENTE previa del lead (RN-004) → PendingActivityExistsException.
 * - La actividad creada inicia en estado PENDIENTE (RN-005).
 */
describe('Activities module', () => {
    describe('CreateActivityUseCase', () => {
        let useCase: CreateActivityUseCase;
        let activityRepository: any;
        let leadRepository: any;

        const validLeadId = 1;
        const leadEncargadoId = 5;
        const DAY_MS = 24 * 60 * 60 * 1000;
        // Fechas relativas a "ahora" para que las pruebas no caduquen y respeten
        // la regla de que la actividad no puede programarse en el pasado.
        const fechaInicio = new Date(Date.now() + DAY_MS);
        const fechaFin = new Date(Date.now() + DAY_MS + 60 * 60 * 1000);

        const buildDto = (
            overrides?: Partial<CreateActivityDto>,
        ): CreateActivityDto =>
            new CreateActivityDto(
                overrides?.idLead ?? validLeadId,
                overrides?.nombreActividad ?? 'Llamada de seguimiento',
                overrides?.fechaInicio ?? fechaInicio,
                overrides?.fechaFin ?? fechaFin,
                overrides?.tipo ?? TipoActividad.LLAMADA,
                overrides?.notas !== undefined ? overrides.notas : null,
            );

        beforeEach(() => {
            activityRepository = {
                findPendingByLead: jest.fn(),
                saveWithRelations: jest.fn(),
                save: jest.fn(),
            };
            leadRepository = { findById: jest.fn() };

            useCase = new CreateActivityUseCase(
                activityRepository,
                leadRepository,
                { timeZone: 'America/Lima' } as unknown as AppTimeConfig,
            );
        });

        it('should create activity assigning the lead encargado as responsable', async () => {
            leadRepository.findById.mockResolvedValue({
                id: validLeadId,
                id_encargado: leadEncargadoId,
            });
            activityRepository.findPendingByLead.mockResolvedValue(null);

            let savedResponsable: number | null = null;
            activityRepository.saveWithRelations.mockImplementation(
                (activity: Actividad) => {
                    savedResponsable = activity.id_responsable;
                    return { activity };
                },
            );

            const result = await useCase.execute(buildDto());

            expect(result).toBeDefined();
            expect(leadRepository.findById).toHaveBeenCalledWith(validLeadId);
            // El responsable se deriva del encargado del lead, no de la petición.
            expect(savedResponsable).toBe(leadEncargadoId);
            expect(activityRepository.findPendingByLead).toHaveBeenCalledWith(
                validLeadId,
            );
            expect(activityRepository.saveWithRelations).toHaveBeenCalled();
        });

        it('should throw when lead does not exist', async () => {
            leadRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(buildDto())).rejects.toThrow(
                ActivityNotFoundException,
            );
            expect(activityRepository.saveWithRelations).not.toHaveBeenCalled();
        });

        it('should throw when fechaFin is before or equal to fechaInicio', async () => {
            leadRepository.findById.mockResolvedValue({
                id: validLeadId,
                id_encargado: leadEncargadoId,
            });

            const dto = buildDto({
                fechaInicio: new Date(Date.now() + 2 * DAY_MS),
                fechaFin: new Date(Date.now() + DAY_MS),
            });

            await expect(useCase.execute(dto)).rejects.toThrow(
                InvalidActivityDateException,
            );
        });

        // Mantis #441: no se puede programar una actividad en el pasado.
        it('should throw when fechaInicio is before the current date', async () => {
            leadRepository.findById.mockResolvedValue({
                id: validLeadId,
                id_encargado: leadEncargadoId,
            });

            const dto = buildDto({
                fechaInicio: new Date(Date.now() - DAY_MS),
                fechaFin: new Date(Date.now() + DAY_MS),
            });

            await expect(useCase.execute(dto)).rejects.toThrow(
                InvalidActivityDateException,
            );
            expect(activityRepository.saveWithRelations).not.toHaveBeenCalled();
        });

        it('should throw when a pending activity already exists for the lead', async () => {
            leadRepository.findById.mockResolvedValue({
                id: validLeadId,
                id_encargado: leadEncargadoId,
            });
            activityRepository.findPendingByLead.mockResolvedValue({
                id: 99,
                estado: EstadoActividad.PENDIENTE,
            });

            await expect(useCase.execute(buildDto())).rejects.toThrow(
                PendingActivityExistsException,
            );
            expect(activityRepository.saveWithRelations).not.toHaveBeenCalled();
        });

        it('should assign PENDIENTE as initial state', async () => {
            leadRepository.findById.mockResolvedValue({
                id: validLeadId,
                id_encargado: leadEncargadoId,
            });
            activityRepository.findPendingByLead.mockResolvedValue(null);

            let savedState: EstadoActividad | null = null;
            activityRepository.saveWithRelations.mockImplementation(
                (activity: Actividad) => {
                    savedState = activity.estado;
                    return { activity };
                },
            );

            await useCase.execute(buildDto());

            expect(savedState).toBe(EstadoActividad.PENDIENTE);
        });

        it('no longer creates the Outlook/Teams event on creation', async () => {
            leadRepository.findById.mockResolvedValue({
                id: validLeadId,
                id_encargado: leadEncargadoId,
            });
            activityRepository.findPendingByLead.mockResolvedValue(null);
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: {},
            });

            await useCase.execute(buildDto({ tipo: TipoActividad.REUNION }));

            // La creación del evento es ahora explícita desde el Calendario.
            expect(activityRepository.save).not.toHaveBeenCalled();
        });
    });
});
