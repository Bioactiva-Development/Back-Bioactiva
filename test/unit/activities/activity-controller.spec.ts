import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ActivityController } from '@/modules/activities/infrastructure/http/activity.controller';
import { CreateActivityUseCase } from '@/modules/activities/application/use-cases/create-activity.use-case';
import { GetActivityByIdUseCase } from '@/modules/activities/application/use-cases/get-activity-by-id.use-case';
import { ListActivitiesUseCase } from '@/modules/activities/application/use-cases/list-activities.use-case';
import { UpdateActivityUseCase } from '@/modules/activities/application/use-cases/update-activity.use-case';
import { CompleteActivityUseCase } from '@/modules/activities/application/use-cases/complete-activity.use-case';
import { CancelActivityUseCase } from '@/modules/activities/application/use-cases/cancel-activity.use-case';
import { DeleteActivityUseCase } from '@/modules/activities/application/use-cases/delete-activity.use-case';

describe('ActivityController', () => {
    let controller: ActivityController;
    const mocks = {
        create: { execute: jest.fn() as any },
        get: { execute: jest.fn() as any },
        list: { execute: jest.fn() as any },
        update: { execute: jest.fn() as any },
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
                { provide: GetActivityByIdUseCase, useValue: mocks.get },
                { provide: ListActivitiesUseCase, useValue: mocks.list },
                { provide: UpdateActivityUseCase, useValue: mocks.update },
                { provide: CompleteActivityUseCase, useValue: mocks.complete },
                { provide: CancelActivityUseCase, useValue: mocks.cancel },
                { provide: DeleteActivityUseCase, useValue: mocks.del },
            ],
        }).compile();
        controller = moduleRef.get(ActivityController);
    });

    it('create delegates and maps to a response dto', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            idLead: 7,
            nombreActividad: 'Llamada',
            fechaInicio: new Date(),
            fechaFin: new Date(),
            tipo: 'LLAMADA',
            idResponsable: 2,
        };
        const result = await controller.create(httpDto);
        expect(mocks.create.execute).toHaveBeenCalled();
        expect(result.id).toBe(1);
    });

    it('findAll returns a paginated response', async () => {
        mocks.list.execute.mockResolvedValue({ data: [enriched], total: 1 });
        const result = await controller.findAll({ page: 1, limit: 10 } as any);
        expect(result.data).toHaveLength(1);
        expect(result.meta.total).toBe(1);
    });

    it('findOne delegates to the get use case', async () => {
        mocks.get.execute.mockResolvedValue(enriched);
        const result = await controller.findOne(1);
        expect(mocks.get.execute).toHaveBeenCalledWith(1);
        expect(result.id).toBe(1);
    });

    it('update delegates with id and dto', async () => {
        mocks.update.execute.mockResolvedValue(enriched);
        await controller.update(1, { nombreActividad: 'X' } as any);
        expect(mocks.update.execute).toHaveBeenCalledWith(1, expect.anything());
    });

    it.each([
        ['complete', 'complete'],
        ['cancel', 'cancel'],
    ] as const)('%s delegates to its use case', async (method, key) => {
        (mocks as any)[key].execute.mockResolvedValue(enriched);
        const result = await (controller as any)[method](1);
        expect((mocks as any)[key].execute).toHaveBeenCalledWith(1);
        expect(result.id).toBe(1);
    });

    it('remove delegates to the delete use case', async () => {
        mocks.del.execute.mockResolvedValue({ ok: true });
        const result = await controller.remove(1);
        expect(mocks.del.execute).toHaveBeenCalledWith(1);
        expect(result).toEqual({ ok: true });
    });
});
