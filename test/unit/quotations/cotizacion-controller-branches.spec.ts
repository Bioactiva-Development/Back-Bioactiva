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

describe('CotizacionController (optional-field branches)', () => {
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

    it('create maps every optional field when all are present', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            fechaCot: '2026-06-01T00:00:00.000Z',
            producto: 'Producto X',
            nombreServicio: 'Desarrollo',
            monto: '5000.00',
            tipo: 'USD',
            observacion: 'Una observación',
            linkPropuesta: 'https://x.com',
            idLead: 10,
            idRemitente: 7,
        };

        await controller.create(httpDto, { id: 3 } as any);

        // cliente y dirigido ya no se reciben por el endpoint: se derivan del
        // lead dentro del caso de uso.
        const passed = mocks.create.execute.mock.calls[0][0];
        expect(passed.producto).toBe('Producto X');
        expect(passed.observacion).toBe('Una observación');
        expect(passed.linkPropuesta).toBe('https://x.com');
    });

    it('create defaults every optional field to null when omitted', async () => {
        mocks.create.execute.mockResolvedValue(enriched);
        const httpDto: any = {
            fechaCot: '2026-06-01T00:00:00.000Z',
            nombreServicio: 'Desarrollo',
            monto: '5000.00',
            tipo: 'USD',
            idLead: 10,
            idRemitente: 7,
        };

        await controller.create(httpDto, { id: 3 } as any);

        const passed = mocks.create.execute.mock.calls[0][0];
        expect(passed.producto).toBeNull();
        expect(passed.observacion).toBeNull();
        expect(passed.linkPropuesta).toBeNull();
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

    it('update converts fechaCot to Date when present', async () => {
        mocks.update.execute.mockResolvedValue(enriched);

        await controller.update(1, {
            fechaCot: '2026-06-01T00:00:00.000Z',
        } as any);

        const dto = mocks.update.execute.mock.calls[0][1];
        expect(dto.fechaCot).toBeInstanceOf(Date);
    });

    it('update leaves fechaCot undefined when omitted', async () => {
        mocks.update.execute.mockResolvedValue(enriched);

        await controller.update(1, { dirigido: 'X' } as any);

        const dto = mocks.update.execute.mock.calls[0][1];
        expect(dto.fechaCot).toBeUndefined();
    });

    it('kpis converts fechaDesde/fechaHasta to Date when present', async () => {
        const kpisResult = {
            totalActivo: 15000.5,
            aceptadas: 3,
            enviadas: 5,
            rechazadas: 2,
        };
        mocks.kpis.execute.mockResolvedValue(kpisResult);

        const result = await controller.kpis({
            fechaDesde: '2026-01-01T00:00:00.000Z',
            fechaHasta: '2026-02-01T00:00:00.000Z',
        } as any);

        const filters = mocks.kpis.execute.mock.calls[0][0];
        expect(filters.fechaDesde).toBeInstanceOf(Date);
        expect(filters.fechaHasta).toBeInstanceOf(Date);
        expect(result).toEqual(kpisResult);
    });

    it('kpis leaves fechaDesde/fechaHasta undefined when omitted', async () => {
        mocks.kpis.execute.mockResolvedValue({
            totalActivo: 0,
            aceptadas: 0,
            enviadas: 0,
            rechazadas: 0,
        });

        await controller.kpis({} as any);

        const filters = mocks.kpis.execute.mock.calls[0][0];
        expect(filters.fechaDesde).toBeUndefined();
        expect(filters.fechaHasta).toBeUndefined();
    });
});
