import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { LeadState } from '@prisma/client';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { PrismaStaleLeadReader } from '@/modules/notifications/infrastructure/persistance/prisma-stale-lead-reader';

describe('Notifications module', () => {
    describe('PrismaStaleLeadReader', () => {
        let reader: PrismaStaleLeadReader;
        let mockPrisma: Partial<PrismaService>;

        const ultimoCambioEstado = new Date('2024-01-01T00:00:00Z');

        beforeEach(() => {
            mockPrisma = {
                lead: {
                    findMany: jest.fn(),
                },
            } as unknown as Partial<PrismaService>;

            reader = new PrismaStaleLeadReader(mockPrisma as any);
        });

        it('should map stale leads and apply the cutoff/exclusion filters', async () => {
            (mockPrisma.lead!.findMany as jest.Mock).mockResolvedValue([
                { id: 1, idEncargado: 10, ultimoCambioEstado },
                { id: 2, idEncargado: 20, ultimoCambioEstado },
            ] as never);

            const result = await reader.getStaleLeads(7);

            expect(result).toEqual([
                { idLead: 1, idEncargado: 10, ultimoCambioEstado },
                { idLead: 2, idEncargado: 20, ultimoCambioEstado },
            ]);

            const arg = (mockPrisma.lead!.findMany as jest.Mock).mock
                .calls[0][0] as any;
            expect(arg.where.deletedAt).toBeNull();
            expect(arg.where.estado.notIn).toEqual([
                LeadState.CIERRE_CON_VENTA,
                LeadState.CIERRE_SIN_VENTA,
            ]);
            expect(arg.where.ultimoCambioEstado.lt).toBeInstanceOf(Date);
            expect(arg.select).toEqual({
                id: true,
                idEncargado: true,
                ultimoCambioEstado: true,
            });
        });

        it('should return an empty array when no leads are stale', async () => {
            (mockPrisma.lead!.findMany as jest.Mock).mockResolvedValue(
                [] as never,
            );

            const result = await reader.getStaleLeads(30);

            expect(result).toEqual([]);
        });
    });
});
