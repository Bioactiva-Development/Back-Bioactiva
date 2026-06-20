import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ActivityController } from '@/modules/activities/infrastructure/http/activity.controller';
import { CreateActivityUseCase } from '@/modules/activities/application/use-cases/create-activity.use-case';
import { CreateActivityCalendarEventUseCase } from '@/modules/activities/application/use-cases/create-activity-calendar-event.use-case';
import { GetActivityByIdUseCase } from '@/modules/activities/application/use-cases/get-activity-by-id.use-case';
import { ListActivitiesUseCase } from '@/modules/activities/application/use-cases/list-activities.use-case';
import { UpdateActivityUseCase } from '@/modules/activities/application/use-cases/update-activity.use-case';
import { UpdateNotesUseCase } from '@/modules/activities/application/use-cases/update-notes.use-case';
import { CompleteActivityUseCase } from '@/modules/activities/application/use-cases/complete-activity.use-case';
import { CancelActivityUseCase } from '@/modules/activities/application/use-cases/cancel-activity.use-case';
import { DeleteActivityUseCase } from '@/modules/activities/application/use-cases/delete-activity.use-case';

describe('ActivityController (optional-field branches)', () => {
    let controller: ActivityController;
    const mocks = {
        create: { execute: jest.fn() as any },
        createCalendarEvent: { execute: jest.fn() as any },
        get: { execute: jest.fn() as any },
        list: { execute: jest.fn() as any },
        update: { execute: jest.fn() as any },
        updateNotes: { execute: jest.fn() as any },
        complete: { execute: jest.fn() as any },
        cancel: { execute: jest.fn() as any },
        del: { execute: jest.fn() as any },
    };

    const enriched: any = {
        activity: {
            id: 1,
            nombre_actividad: 'Llamada',
            tipo: 'LLAMADA',
            estado: 'PENDIENTE',
            fecha_inicio: new Date(),
            fecha_fin: new Date(),
            notas: null,
            id_lead: 7,
            id_responsable: 2,
            outlook_event_id: null,
            teams_meeting_url: null,
            created_at: new Date(),
            updated_at: new Date(),
        },
        leadServicioInteres: 'Consultoría',
        leadEstado: 'EN_PROSPECTO',
        responsableNombre: 'Carlos',
        responsableApellidos: 'López',
    };

    beforeEach(async () => {
        Object.values(mocks).forEach((m) => m.execute.mockReset());
        const moduleRef = await Test.createTestingModule({
            controllers: [ActivityController],
            providers: [
                { provide: CreateActivityUseCase, useValue: mocks.create },
                {
                    provide: CreateActivityCalendarEventUseCase,
                    useValue: mocks.createCalendarEvent,
                },
                { provide: GetActivityByIdUseCase, useValue: mocks.get },
                { provide: ListActivitiesUseCase, useValue: mocks.list },
                { provide: UpdateActivityUseCase, useValue: mocks.update },
                { provide: UpdateNotesUseCase, useValue: mocks.updateNotes },
                { provide: CompleteActivityUseCase, useValue: mocks.complete },
                { provide: CancelActivityUseCase, useValue: mocks.cancel },
                { provide: DeleteActivityUseCase, useValue: mocks.del },
            ],
        }).compile();
        controller = moduleRef.get(ActivityController);
    });

    it('create maps notas when present', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            idLead: 7,
            nombreActividad: 'Llamada',
            fechaInicio: new Date(),
            fechaFin: new Date(),
            tipo: 'LLAMADA',
            notas: 'Una nota',
        };

        await controller.create(httpDto);

        const dto = mocks.create.execute.mock.calls[0][0];
        expect(dto.notas).toBe('Una nota');
    });

    it('create defaults notas to null when omitted', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            idLead: 7,
            nombreActividad: 'Llamada',
            fechaInicio: new Date(),
            fechaFin: new Date(),
            tipo: 'LLAMADA',
        };

        await controller.create(httpDto);

        const dto = mocks.create.execute.mock.calls[0][0];
        expect(dto.notas).toBeNull();
    });
});
