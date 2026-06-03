import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaCotizacionRepository } from '@/modules/quotations/infrastructure/persistance/prisma-cotizacion.repository';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { CotizacionConflictException } from '@/modules/quotations/domain/exceptions/cotizacion-conflict.exception';

/**
 * PrismaCotizacionRepository — acceptAndUpdateLead / rejectAndUpdateLead
 * ---------------------------------------------------------------------
 * Verifica la concurrencia optimista de las transiciones de estado:
 * - El update aplica la guarda atómica `where: { id, estado: <esperado> }`.
 * - Si la transacción falla con P2025 (otra operación ya cambió el estado),
 *   se traduce a CotizacionConflictException (409) en lugar de 404.
 */
describe('Quotations module', () => {
    describe('PrismaCotizacionRepository (state transitions)', () => {
        let repository: PrismaCotizacionRepository;
        let prismaService: any;

        const enrichedRecord = (estado: string) => ({
            id: 1,
            fechaCot: new Date('2026-02-01T00:00:00.000Z'),
            dirigido: 'Dr. Martinez',
            cliente: 'TechCorp SA',
            producto: 'Licencia',
            nombreRemitente: 'Juan Perez',
            nombreServicio: 'Desarrollo',
            monto: '5000.00',
            tipo: 'USD',
            estado,
            observacion: null,
            linkPropuesta: null,
            idLead: 10,
            idRemitente: 7,
            idAuthor: 3,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            deletedAt: null,
            lead: {
                servicioInteres: 'Consultoría',
                estado: 'OFERTADO',
                contacto: { nombres: 'María', apellidos: 'Gómez' },
            },
            remitente: { nombres: 'Juan', apellidos: 'Perez' },
        });

        function createPrismaError(code: string, message: string) {
            const error = new Error(message) as any;
            error.code = code;
            error.name = 'PrismaClientKnownRequestError';
            return error;
        }

        beforeEach(() => {
            prismaService = {
                cotizacion: { update: jest.fn() },
                lead: { update: jest.fn() },
                $transaction: jest.fn(),
            };
            repository = new PrismaCotizacionRepository(prismaService);
        });

        it('should guard the update with the expected current state (optimistic concurrency)', async () => {
            prismaService.$transaction.mockResolvedValue([
                enrichedRecord('ACEPTADA'),
                {},
            ]);

            await repository.acceptAndUpdateLead(
                1,
                10,
                LeadState.CIERRE_CON_VENTA,
                EstadoCot.PENDIENTE,
            );

            expect(prismaService.cotizacion.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1, estado: 'PENDIENTE' },
                    data: expect.objectContaining({ estado: 'ACEPTADA' }),
                }),
            );
        });

        it('should return the enriched quotation on success', async () => {
            prismaService.$transaction.mockResolvedValue([
                enrichedRecord('ACEPTADA'),
                {},
            ]);

            const result = await repository.acceptAndUpdateLead(
                1,
                10,
                LeadState.CIERRE_CON_VENTA,
                EstadoCot.ENVIADA,
            );

            expect(result.cotizacion.estado).toBe(EstadoCot.ACEPTADA);
            expect(result.leadServicioInteres).toBe('Consultoría');
            expect(result.contactName).toBe('María Gómez');
            expect(result.remitenteNombre).toBe('Juan');
        });

        it('should translate P2025 to CotizacionConflictException on accept', async () => {
            prismaService.$transaction.mockRejectedValue(
                createPrismaError('P2025', 'Record to update not found.'),
            );

            await expect(
                repository.acceptAndUpdateLead(
                    1,
                    10,
                    LeadState.CIERRE_CON_VENTA,
                    EstadoCot.PENDIENTE,
                ),
            ).rejects.toThrow(CotizacionConflictException);
        });

        it('should translate P2025 to CotizacionConflictException on reject', async () => {
            prismaService.$transaction.mockRejectedValue(
                createPrismaError('P2025', 'Record to update not found.'),
            );

            await expect(
                repository.rejectAndUpdateLead(
                    1,
                    10,
                    LeadState.CIERRE_SIN_VENTA,
                    EstadoCot.ENVIADA,
                ),
            ).rejects.toThrow(CotizacionConflictException);
        });

        it('should re-throw unknown Prisma errors', async () => {
            const prismaError = createPrismaError(
                'P2000',
                'Value too long for column.',
            );
            prismaService.$transaction.mockRejectedValue(prismaError);

            await expect(
                repository.acceptAndUpdateLead(
                    1,
                    10,
                    LeadState.CIERRE_CON_VENTA,
                    EstadoCot.PENDIENTE,
                ),
            ).rejects.toThrow(prismaError);
        });
    });
});
