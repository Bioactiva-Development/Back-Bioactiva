import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { LeadController } from '@/modules/leads/infrastructure/http/lead.controller';
import { CreateLeadUseCase } from '@/modules/leads/application/use-cases/create-lead.use-case';
import { GetLeadByIdUseCase } from '@/modules/leads/application/use-cases/get-lead-by-id.use-case';
import { ListLeadsUseCase } from '@/modules/leads/application/use-cases/list-leads.use-case';
import { UpdateLeadUseCase } from '@/modules/leads/application/use-cases/update-lead.use-case';
import { ChangeLeadStatusUseCase } from '@/modules/leads/application/use-cases/change-lead-status.use-case';
import { DeleteLeadUseCase } from '@/modules/leads/application/use-cases/delete-lead.use-case';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

describe('LeadController', () => {
    let controller: LeadController;
    const mocks = {
        create: { execute: jest.fn() as any },
        get: { execute: jest.fn() as any },
        list: { execute: jest.fn() as any },
        update: { execute: jest.fn() as any },
        changeStatus: { execute: jest.fn() as any },
        del: { execute: jest.fn() as any },
    };

    const enriched: any = {
        lead: {
            id: 1,
            estado: 'EN_PROSPECTO',
            servicio_interes: 'Consultoría',
            comentarios: null,
            desafio_oportunidad: null,
            canal_captacion: null,
            id_org: 'org-1',
            id_contacto: null,
            id_encargado: 2,
            id_author: 3,
            created_at: new Date(),
            updated_at: new Date(),
            ultimo_cambio: new Date(),
        },
        organizationName: 'Bioactiva SAC',
        encargadoNombre: 'Carlos',
        encargadoApellidos: 'López',
        contactName: null,
    };

    beforeEach(async () => {
        Object.values(mocks).forEach((m) => m.execute.mockReset());
        const moduleRef = await Test.createTestingModule({
            controllers: [LeadController],
            providers: [
                { provide: CreateLeadUseCase, useValue: mocks.create },
                { provide: GetLeadByIdUseCase, useValue: mocks.get },
                { provide: ListLeadsUseCase, useValue: mocks.list },
                { provide: UpdateLeadUseCase, useValue: mocks.update },
                {
                    provide: ChangeLeadStatusUseCase,
                    useValue: mocks.changeStatus,
                },
                { provide: DeleteLeadUseCase, useValue: mocks.del },
                {
                    provide: AppTimeConfig,
                    useValue: { timeZone: 'America/Lima' },
                },
            ],
        }).compile();
        controller = moduleRef.get(LeadController);
    });

    it('create maps the dto and injects the author', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            idOrg: 'org-1',
            servicioInteres: 'Consultoría',
            idEncargado: 2,
        };
        const result = await controller.create(httpDto, { id: 3 } as any);
        expect(mocks.create.execute.mock.calls[0][0].idAuthor).toBe(3);
        expect(result.id).toBe(1);
    });

    it('findAll returns a paginated response', async () => {
        mocks.list.execute.mockResolvedValue({ data: [enriched], total: 1 });
        const result = await controller.findAll(
            { page: 1, limit: 10 } as any,
            { id: 9 } as any,
        );
        expect(result.data).toHaveLength(1);
        expect(result.meta.total).toBe(1);
    });

    it('findAll maps misLeads to the authenticated user id as encargado', async () => {
        mocks.list.execute.mockResolvedValue({ data: [], total: 0 });
        await controller.findAll(
            { misLeads: true, page: 1, limit: 10 } as any,
            { id: 9 } as any,
        );
        expect(mocks.list.execute.mock.calls[0][0].idEncargado).toBe(9);
    });

    it('findAll forwards conActividadesPendientes', async () => {
        mocks.list.execute.mockResolvedValue({ data: [], total: 0 });
        await controller.findAll(
            { conActividadesPendientes: true, page: 1, limit: 10 } as any,
            { id: 9 } as any,
        );
        expect(
            mocks.list.execute.mock.calls[0][0].conActividadesPendientes,
        ).toBe(true);
    });

    it('findOne delegates to the get use case', async () => {
        mocks.get.execute.mockResolvedValue(enriched);
        const result = await controller.findOne(1);
        expect(mocks.get.execute).toHaveBeenCalledWith(1);
        expect(result.id).toBe(1);
    });

    it('update delegates with id and dto', async () => {
        mocks.update.execute.mockResolvedValue(enriched);
        await controller.update(1, { servicioInteres: 'X' } as any);
        expect(mocks.update.execute).toHaveBeenCalledWith(1, expect.anything());
    });

    it('changeStatus delegates with the new estado', async () => {
        mocks.changeStatus.execute.mockResolvedValue(enriched);
        await controller.changeStatus(1, { estado: 'OFERTADO' } as any);
        expect(mocks.changeStatus.execute).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ estado: 'OFERTADO' }),
        );
    });

    it('remove delegates to the delete use case', async () => {
        mocks.del.execute.mockResolvedValue({ ok: true });
        const result = await controller.remove(1);
        expect(mocks.del.execute).toHaveBeenCalledWith(1);
        expect(result).toEqual({ ok: true });
    });
});
