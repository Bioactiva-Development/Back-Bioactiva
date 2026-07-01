import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaCotizacionRepository } from '@/modules/quotations/infrastructure/persistance/prisma-cotizacion.repository';

describe('Quotations module', () => {
    describe('PrismaCotizacionRepository.getKpis', () => {
        let repository: PrismaCotizacionRepository;
        let prismaService: any;

        beforeEach(() => {
            prismaService = {
                cotizacion: { groupBy: jest.fn() },
            };
            repository = new PrismaCotizacionRepository(prismaService);
        });

        it('sums totalActivo from ACEPTADA/ENVIADA/PENDIENTE and counts each estado', async () => {
            prismaService.cotizacion.groupBy.mockResolvedValue([
                { estado: 'ACEPTADA', _count: { id: 3 }, _sum: { monto: 1000 } },
                { estado: 'ENVIADA', _count: { id: 5 }, _sum: { monto: 2000 } },
                { estado: 'RECHAZADA', _count: { id: 2 }, _sum: { monto: 500 } },
                { estado: 'PENDIENTE', _count: { id: 4 }, _sum: { monto: 3000 } },
            ]);

            const result = await repository.getKpis();

            // RECHAZADA no suma a totalActivo (cotizaciones no activas).
            expect(result).toEqual({
                totalActivo: 6000,
                aceptadas: 3,
                enviadas: 5,
                rechazadas: 2,
            });
        });

        it('returns all zeros when there are no cotizaciones', async () => {
            prismaService.cotizacion.groupBy.mockResolvedValue([]);

            const result = await repository.getKpis();

            expect(result).toEqual({
                totalActivo: 0,
                aceptadas: 0,
                enviadas: 0,
                rechazadas: 0,
            });
        });

        it('treats a null _sum.monto as zero', async () => {
            prismaService.cotizacion.groupBy.mockResolvedValue([
                { estado: 'ACEPTADA', _count: { id: 1 }, _sum: { monto: null } },
            ]);

            const result = await repository.getKpis();

            expect(result.totalActivo).toBe(0);
            expect(result.aceptadas).toBe(1);
        });

        it('applies only fechaDesde when fechaHasta is omitted', async () => {
            prismaService.cotizacion.groupBy.mockResolvedValue([]);
            const fechaDesde = new Date('2026-01-01T00:00:00.000Z');

            await repository.getKpis({ fechaDesde });

            const call = prismaService.cotizacion.groupBy.mock.calls[0][0];
            expect(call.where.fechaCot).toEqual({ gte: fechaDesde });
        });

        it('applies only fechaHasta when fechaDesde is omitted', async () => {
            prismaService.cotizacion.groupBy.mockResolvedValue([]);
            const fechaHasta = new Date('2026-02-01T00:00:00.000Z');

            await repository.getKpis({ fechaHasta });

            const call = prismaService.cotizacion.groupBy.mock.calls[0][0];
            expect(call.where.fechaCot).toEqual({ lte: fechaHasta });
        });

        it('applies both fechaDesde and fechaHasta when present', async () => {
            prismaService.cotizacion.groupBy.mockResolvedValue([]);
            const fechaDesde = new Date('2026-01-01T00:00:00.000Z');
            const fechaHasta = new Date('2026-02-01T00:00:00.000Z');

            await repository.getKpis({ fechaDesde, fechaHasta });

            const call = prismaService.cotizacion.groupBy.mock.calls[0][0];
            expect(call.where.fechaCot).toEqual({
                gte: fechaDesde,
                lte: fechaHasta,
            });
        });

        it('omits the fechaCot filter entirely when no date range is given', async () => {
            prismaService.cotizacion.groupBy.mockResolvedValue([]);

            await repository.getKpis();

            const call = prismaService.cotizacion.groupBy.mock.calls[0][0];
            expect(call.where.fechaCot).toBeUndefined();
        });
    });
});
