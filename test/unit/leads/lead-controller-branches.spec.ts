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

describe('LeadController (optional-field branches)', () => {
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

    it('create maps every optional field when all are present', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            idOrg: 'org-1',
            idContacto: 5,
            servicioInteres: 'Consultoría',
            comentarios: 'comentario',
            desafioOportunidad: 'desafío',
            canalCaptacion: 'web',
            idEncargado: 2,
        };

        await controller.create(httpDto, { id: 3 } as any);

        const dto = mocks.create.execute.mock.calls[0][0];
        expect(dto.idContacto).toBe(5);
        expect(dto.comentarios).toBe('comentario');
        expect(dto.desafioOportunidad).toBe('desafío');
        expect(dto.canalCaptacion).toBe('web');
    });

    it('create defaults every optional field to null when omitted', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            idOrg: 'org-1',
            servicioInteres: 'Consultoría',
            idEncargado: 2,
        };

        await controller.create(httpDto, { id: 3 } as any);

        const dto = mocks.create.execute.mock.calls[0][0];
        expect(dto.idContacto).toBeNull();
        expect(dto.comentarios).toBeNull();
        expect(dto.desafioOportunidad).toBeNull();
        expect(dto.canalCaptacion).toBeNull();
    });

    it('findAll converts fechaDesde/fechaHasta to Date when present', async () => {
        mocks.list.execute.mockResolvedValue({ data: [], total: 0 });

        await controller.findAll({
            fechaDesde: '2026-01-01T00:00:00.000Z',
            fechaHasta: '2026-02-01T00:00:00.000Z',
            page: 1,
            limit: 10,
        } as any);

        const dto = mocks.list.execute.mock.calls[0][0];
        expect(dto.fechaDesde).toBeInstanceOf(Date);
        expect(dto.fechaHasta).toBeInstanceOf(Date);
    });

    it('findAll leaves fechaDesde/fechaHasta undefined when omitted', async () => {
        mocks.list.execute.mockResolvedValue({ data: [], total: 0 });

        await controller.findAll({ page: 1, limit: 10 } as any);

        const dto = mocks.list.execute.mock.calls[0][0];
        expect(dto.fechaDesde).toBeUndefined();
        expect(dto.fechaHasta).toBeUndefined();
    });
});
