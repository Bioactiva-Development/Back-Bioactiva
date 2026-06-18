import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaCotizacionRepository } from '@/modules/quotations/infrastructure/persistance/prisma-cotizacion.repository';

describe('Quotations module', () => {
    describe('PrismaCotizacionRepository.list filters', () => {
        let repository: PrismaCotizacionRepository;
        let prismaService: any;

        beforeEach(() => {
            prismaService = { cotizacion: { findMany: jest.fn() } };
            prismaService.cotizacion.findMany.mockResolvedValue([]);
            repository = new PrismaCotizacionRepository(prismaService);
        });

        it('filters by currency (tipo) when provided', async () => {
            await repository.list({ tipo: 'PEN' });

            expect(prismaService.cotizacion.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tipo: 'PEN',
                        deletedAt: null,
                    }),
                }),
            );
        });

        it('ignores an invalid tipo value', async () => {
            await repository.list({ tipo: 'BTC' });

            const callArg = prismaService.cotizacion.findMany.mock.calls[0][0];
            expect(callArg.where.tipo).toBeUndefined();
        });

        it('filters by the organization of the associated lead (idOrg)', async () => {
            await repository.list({ idOrg: 'org-uuid-1' });

            expect(prismaService.cotizacion.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        lead: { idOrg: 'org-uuid-1' },
                        deletedAt: null,
                    }),
                }),
            );
        });

        it('combines tipo with estado and idLead', async () => {
            await repository.list({
                tipo: 'USD',
                estado: 'PENDIENTE',
                idLead: 10,
            });

            expect(prismaService.cotizacion.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tipo: 'USD',
                        estado: 'PENDIENTE',
                        idLead: 10,
                    }),
                }),
            );
        });
    });
});
