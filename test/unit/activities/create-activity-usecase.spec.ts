import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateActivityUseCase } from '@/modules/activities/application/use-cases/create-activity.use-case';
import { CreateActivityDto } from '@/modules/activities/application/dto/create-activity.dto';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';
import { InvalidActivityDateException } from '@/modules/activities/domain/exceptions/invalid-activity-date.exception';
import { PendingActivityExistsException } from '@/modules/activities/domain/exceptions/pending-activity-exists.exception';

/**
 * CreateActivityUseCase
 * ---------------------
 * Verifica las validaciones de creación con repositorios mockeados:
 * - Lead existente y no eliminado (RN-001) → si no, ActivityNotFoundException.
 * - Responsable existente (RN-002) → si no, ActivityNotFoundException.
 * - fechaInicio < fechaFin (RN-003) → InvalidActivityDateException.
 * - Sin actividad PENDIENTE previa del lead (RN-004) → PendingActivityExistsException.
 * - La actividad creada inicia en estado PENDIENTE (RN-005).
 */
describe('Activities module', () => {
    describe('CreateActivityUseCase', () => {
        let useCase: CreateActivityUseCase;
        let activityRepository: any;
        let leadRepository: any;
        let userRepository: any;
        let calendarSync: any;

        const validLeadId = 1;
        const validResponsableId = 5;
        const fechaInicio = new Date('2026-06-01T10:00:00.000Z');
        const fechaFin = new Date('2026-06-01T11:00:00.000Z');

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
                overrides?.idResponsable ?? validResponsableId,
                overrides?.syncWithMicrosoft ?? false,
                overrides?.createTeamsMeeting ?? false,
            );

        const buildSavedActivity = (tipo = TipoActividad.LLAMADA) =>
            new Actividad(
                1,
                'Llamada de seguimiento',
                fechaInicio,
                fechaFin,
                tipo,
                EstadoActividad.PENDIENTE,
                null,
                null,
                false,
                null,
                false,
                validLeadId,
                validResponsableId,
                new Date(),
                new Date(),
                null,
            );

        beforeEach(() => {
            activityRepository = {
                findPendingByLead: jest.fn(),
                saveWithRelations: jest.fn(),
                save: jest.fn(),
            };
            leadRepository = { findById: jest.fn() };
            userRepository = { findById: jest.fn() };
            calendarSync = {
                isUserConnected: jest.fn(),
                createCalendarEvent: jest.fn(),
                updateCalendarEvent: jest.fn(),
                deleteCalendarEvent: jest.fn(),
                createTeamsMeeting: jest.fn(),
            };

            useCase = new CreateActivityUseCase(
                activityRepository,
                leadRepository,
                userRepository,
                calendarSync,
            );
        });

        it('should create activity with valid data', async () => {
            leadRepository.findById.mockResolvedValue({ id: validLeadId });
            userRepository.findById.mockResolvedValue({
                id: validResponsableId,
            });
            activityRepository.findPendingByLead.mockResolvedValue(null);
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: {},
            });

            const result = await useCase.execute(buildDto());

            expect(result).toBeDefined();
            expect(leadRepository.findById).toHaveBeenCalledWith(validLeadId);
            expect(userRepository.findById).toHaveBeenCalledWith(
                validResponsableId,
            );
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

        it('should throw when responsable does not exist', async () => {
            leadRepository.findById.mockResolvedValue({ id: validLeadId });
            userRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(buildDto())).rejects.toThrow(
                ActivityNotFoundException,
            );
        });

        it('should throw when fechaFin is before or equal to fechaInicio', async () => {
            leadRepository.findById.mockResolvedValue({ id: validLeadId });
            userRepository.findById.mockResolvedValue({
                id: validResponsableId,
            });

            const dto = buildDto({
                fechaInicio: new Date('2026-06-01T11:00:00.000Z'),
                fechaFin: new Date('2026-06-01T10:00:00.000Z'),
            });

            await expect(useCase.execute(dto)).rejects.toThrow(
                InvalidActivityDateException,
            );
        });

        it('should throw when a pending activity already exists for the lead', async () => {
            leadRepository.findById.mockResolvedValue({ id: validLeadId });
            userRepository.findById.mockResolvedValue({
                id: validResponsableId,
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
            leadRepository.findById.mockResolvedValue({ id: validLeadId });
            userRepository.findById.mockResolvedValue({
                id: validResponsableId,
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

        const arrangeValidCreate = (saved: Actividad) => {
            leadRepository.findById.mockResolvedValue({ id: validLeadId });
            userRepository.findById.mockResolvedValue({
                id: validResponsableId,
            });
            activityRepository.findPendingByLead.mockResolvedValue(null);
            activityRepository.saveWithRelations.mockResolvedValue({
                activity: saved,
            });
        };

        // Caso 1: usuario sin Microsoft conectado
        it('should create the activity without Outlook/Teams when user is not connected', async () => {
            const saved = buildSavedActivity();
            arrangeValidCreate(saved);
            calendarSync.isUserConnected.mockResolvedValue(false);

            await useCase.execute(buildDto({ syncWithMicrosoft: true }));

            expect(calendarSync.createCalendarEvent).not.toHaveBeenCalled();
            expect(saved.outlook_event_id).toBeNull();
            expect(saved.teams_meeting_url).toBeNull();
        });

        it('should not sync at all when syncWithMicrosoft is false', async () => {
            const saved = buildSavedActivity();
            arrangeValidCreate(saved);

            await useCase.execute(buildDto({ syncWithMicrosoft: false }));

            expect(calendarSync.isUserConnected).not.toHaveBeenCalled();
            expect(calendarSync.createCalendarEvent).not.toHaveBeenCalled();
        });

        // Caso 2: usuario conectado -> evento Outlook creado
        it('should create the Outlook event when user is connected', async () => {
            const saved = buildSavedActivity();
            arrangeValidCreate(saved);
            calendarSync.isUserConnected.mockResolvedValue(true);
            calendarSync.createCalendarEvent.mockResolvedValue('evt-1');

            await useCase.execute(buildDto({ syncWithMicrosoft: true }));

            expect(calendarSync.createCalendarEvent).toHaveBeenCalledWith(
                validResponsableId,
                expect.objectContaining({ subject: 'Llamada de seguimiento' }),
            );
            expect(saved.outlook_event_id).toBe('evt-1');
            expect(saved.teams_meeting_url).toBeNull();
            expect(activityRepository.save).toHaveBeenCalledWith(saved);
        });

        // Caso 3: usuario conectado + Teams (tipo REUNION)
        it('should create Outlook event and Teams meeting for a REUNION', async () => {
            const saved = buildSavedActivity(TipoActividad.REUNION);
            arrangeValidCreate(saved);
            calendarSync.isUserConnected.mockResolvedValue(true);
            calendarSync.createCalendarEvent.mockResolvedValue('evt-1');
            calendarSync.createTeamsMeeting.mockResolvedValue(
                'https://teams.microsoft.com/l/meetup-join/xyz',
            );

            await useCase.execute(
                buildDto({
                    tipo: TipoActividad.REUNION,
                    syncWithMicrosoft: true,
                    createTeamsMeeting: true,
                }),
            );

            expect(saved.outlook_event_id).toBe('evt-1');
            expect(saved.teams_meeting_url).toBe(
                'https://teams.microsoft.com/l/meetup-join/xyz',
            );
        });

        // RN-004: solo REUNION puede generar Teams
        it('should not create a Teams meeting for a non-REUNION activity', async () => {
            const saved = buildSavedActivity(TipoActividad.LLAMADA);
            arrangeValidCreate(saved);
            calendarSync.isUserConnected.mockResolvedValue(true);
            calendarSync.createCalendarEvent.mockResolvedValue('evt-1');

            await useCase.execute(
                buildDto({
                    tipo: TipoActividad.LLAMADA,
                    syncWithMicrosoft: true,
                    createTeamsMeeting: true,
                }),
            );

            expect(calendarSync.createTeamsMeeting).not.toHaveBeenCalled();
            expect(saved.teams_meeting_url).toBeNull();
        });

        // RN-003: un error de Microsoft no impide crear la actividad
        it('should keep the activity created when Outlook sync fails', async () => {
            const saved = buildSavedActivity();
            arrangeValidCreate(saved);
            calendarSync.isUserConnected.mockResolvedValue(true);
            calendarSync.createCalendarEvent.mockRejectedValue(
                new Error('Graph API down'),
            );

            const result = await useCase.execute(
                buildDto({ syncWithMicrosoft: true }),
            );

            expect(result).toBeDefined();
            expect(saved.outlook_event_id).toBeNull();
        });
    });
});
