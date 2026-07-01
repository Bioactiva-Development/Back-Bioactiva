import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { CotizacionController } from '@/modules/quotations/infrastructure/http/cotizacion.controller';
import { CreateCotizacionUseCase } from '@/modules/quotations/application/use-cases/create-cotizacion.use-case';
import { GetCotizacionByIdUseCase } from '@/modules/quotations/application/use-cases/get-cotizacion-by-id.use-case';
import { GetKpisCotizacionesUseCase } from '@/modules/quotations/application/use-cases/get-kpis-cotizaciones.use-case';
import { ListCotizacionesUseCase } from '@/modules/quotations/application/use-cases/list-cotizaciones.use-case';
import { UpdateCotizacionUseCase } from '@/modules/quotations/application/use-cases/update-cotizacion.use-case';
import { SendCotizacionUseCase } from '@/modules/quotations/application/use-cases/send-cotizacion.use-case';
import { AcceptCotizacionUseCase } from '@/modules/quotations/application/use-cases/accept-cotizacion.use-case';
import { RejectCotizacionUseCase } from '@/modules/quotations/application/use-cases/reject-cotizacion.use-case';
import { DeleteCotizacionUseCase } from '@/modules/quotations/application/use-cases/delete-cotizacion.use-case';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';

describe('CotizacionController', () => {
    let controller: CotizacionController;
    const mocks = {
        create: { execute: jest.fn() as any },
        get: { execute: jest.fn() as any },
        kpis: { execute: jest.fn() as any },
        list: { execute: jest.fn() as any },
        update: { execute: jest.fn() as any },
        send: { execute: jest.fn() as any },
        accept: { execute: jest.fn() as any },
        reject: { execute: jest.fn() as any },
        del: { execute: jest.fn() as any },
    };

    const enriched = {
        cotizacion: {
            id: 1,
            fecha_cot: new Date('2026-06-01T00:00:00.000Z'),
            dirigido: 'Dr. Martinez',
            cliente: 'TechCorp',
            producto: null,
            nombre_remitente: 'Juan Perez',
            nombre_servicio: 'Desarrollo',
            monto: '5000.00',
            tipo: 'USD',
            estado: 'PENDIENTE',
            observacion: null,
            link_propuesta: null,
            id_lead: 10,
            id_remitente: 7,
            id_author: 3,
            created_at: new Date('2026-01-01T00:00:00.000Z'),
            updated_at: new Date('2026-01-01T00:00:00.000Z'),
        },
        leadServicioInteres: 'Consultoría',
        leadEstado: 'EN_PROSPECTO',
        contactName: 'María Gómez',
        remitenteNombre: 'Carlos',
        remitenteApellidos: 'López',
    };

    beforeEach(async () => {
        Object.values(mocks).forEach((m) => m.execute.mockReset());

        const moduleRef = await Test.createTestingModule({
            controllers: [CotizacionController],
            providers: [
                { provide: CreateCotizacionUseCase, useValue: mocks.create },
                { provide: GetCotizacionByIdUseCase, useValue: mocks.get },
                { provide: GetKpisCotizacionesUseCase, useValue: mocks.kpis },
                { provide: ListCotizacionesUseCase, useValue: mocks.list },
                { provide: UpdateCotizacionUseCase, useValue: mocks.update },
                { provide: SendCotizacionUseCase, useValue: mocks.send },
                { provide: AcceptCotizacionUseCase, useValue: mocks.accept },
                { provide: RejectCotizacionUseCase, useValue: mocks.reject },
                { provide: DeleteCotizacionUseCase, useValue: mocks.del },
                {
                    provide: AppTimeConfig,
                    useValue: { timeZone: 'America/Lima' },
                },
            ],
        }).compile();

        controller = moduleRef.get(CotizacionController);
    });

    it('create maps the http dto and injects the author from the current user', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            fechaCot: '2026-06-01T00:00:00.000Z',
            dirigido: 'Dr. Martinez',
            nombreServicio: 'Desarrollo',
            monto: '5000.00',
            tipo: 'USD',
            idLead: 10,
            idRemitente: 7,
        };

        const result = await controller.create(httpDto, { id: 3 } as any);

        const passed = mocks.create.execute.mock.calls[0][0];
        expect(passed.idAuthor).toBe(3);
        expect(passed.idLead).toBe(10);
        expect(passed.fechaCot).toBeInstanceOf(Date);
        expect(result.id).toBe(1);
        expect(result.remitenteName).toBe('Carlos López');
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
        const result = await controller.update(1, { dirigido: 'X' } as any);
        expect(mocks.update.execute).toHaveBeenCalledWith(1, expect.anything());
        expect(result.id).toBe(1);
    });

    it.each([
        ['send', 'send'],
        ['accept', 'accept'],
        ['reject', 'reject'],
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
