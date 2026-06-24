import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AcceptCotizacionUseCase } from '@/modules/quotations/application/use-cases/accept-cotizacion.use-case';
import { RejectCotizacionUseCase } from '@/modules/quotations/application/use-cases/reject-cotizacion.use-case';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';
import { InvalidCotizacionTransitionException } from '@/modules/quotations/domain/exceptions/invalid-cotizacion-transition.exception';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadHasPendingActivitiesException } from '@/modules/leads/domain/exceptions/lead-has-pending-activities.exception';

/**
 * Accept / Reject Cotizacion use cases
 * ------------------------------------
 * Verifican, con repositorios mockeados:
 * - Cotización inexistente → CotizacionNotFoundException.
 * - Transición de estado inválida (ACEPTADA/RECHAZADA) → InvalidCotizacionTransitionException.
 * - Lead inexistente → LeadNotFoundException (la cotización ya pasó validación).
 * - El estado leído antes de la transición se propaga como token de concurrencia
 *   optimista (expectedEstado) al repositorio.
 */
describe('Quotations module', () => {
    const buildCotizacion = (estado: EstadoCot, id = 1, idLead = 10) =>
        new Cotizacion(
            id,
            new Date('2026-02-01T00:00:00.000Z'),
            'Dr. Martinez',
            'TechCorp SA',
            'Licencia Software Pro',
            'Juan Perez',
            'Desarrollo Customizado',
            '5000.00',
            TipoMoneda.USD,
            estado,
            'Incluye 3 meses de soporte',
            'https://proposal.techcorp.com/cot-001',
            idLead,
            7,
            3,
            new Date('2026-01-01T00:00:00.000Z'),
            new Date('2026-01-01T00:00:00.000Z'),
            null,
        );

    describe('AcceptCotizacionUseCase', () => {
        let useCase: AcceptCotizacionUseCase;
        let cotizacionRepository: any;
        let leadRepository: any;

        beforeEach(() => {
            cotizacionRepository = {
                findById: jest.fn(),
                acceptAndUpdateLead: jest.fn(),
            };
            leadRepository = {
                findById: jest.fn(),
                hasPendingActivities: jest
                    .fn<() => Promise<boolean>>()
                    .mockResolvedValue(false),
            };
            useCase = new AcceptCotizacionUseCase(
                cotizacionRepository,
                leadRepository,
            );
        });

        it('should accept from PENDIENTE and pass expectedEstado to the repository', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.PENDIENTE, 1, 10),
            );
            leadRepository.findById.mockResolvedValue({
                id: 10,
                changeState: jest.fn(),
            });
            cotizacionRepository.acceptAndUpdateLead.mockResolvedValue({});

            await useCase.execute(1);

            expect(
                cotizacionRepository.acceptAndUpdateLead,
            ).toHaveBeenCalledWith(
                1,
                10,
                LeadState.CIERRE_CON_VENTA,
                EstadoCot.PENDIENTE,
            );
        });

        it('should propagate ENVIADA as expectedEstado when accepting a sent quotation', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.ENVIADA, 2, 20),
            );
            leadRepository.findById.mockResolvedValue({
                id: 20,
                changeState: jest.fn(),
            });
            cotizacionRepository.acceptAndUpdateLead.mockResolvedValue({});

            await useCase.execute(2);

            expect(
                cotizacionRepository.acceptAndUpdateLead,
            ).toHaveBeenCalledWith(
                2,
                20,
                LeadState.CIERRE_CON_VENTA,
                EstadoCot.ENVIADA,
            );
        });

        it('should throw when the quotation does not exist', async () => {
            cotizacionRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(99)).rejects.toThrow(
                CotizacionNotFoundException,
            );
            expect(
                cotizacionRepository.acceptAndUpdateLead,
            ).not.toHaveBeenCalled();
        });

        it('should throw on invalid transition when already ACEPTADA', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.ACEPTADA),
            );

            await expect(useCase.execute(1)).rejects.toThrow(
                InvalidCotizacionTransitionException,
            );
            expect(leadRepository.findById).not.toHaveBeenCalled();
        });

        it('should throw when the associated lead does not exist', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.PENDIENTE, 1, 10),
            );
            leadRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(1)).rejects.toThrow(
                LeadNotFoundException,
            );
            expect(
                cotizacionRepository.acceptAndUpdateLead,
            ).not.toHaveBeenCalled();
        });

        it('should throw when the lead has pending activities and not close the lead', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.PENDIENTE, 1, 10),
            );
            leadRepository.findById.mockResolvedValue({
                id: 10,
                changeState: jest.fn(),
            });
            leadRepository.hasPendingActivities.mockResolvedValue(true);

            await expect(useCase.execute(1)).rejects.toThrow(
                LeadHasPendingActivitiesException,
            );
            expect(leadRepository.hasPendingActivities).toHaveBeenCalledWith(10);
            expect(
                cotizacionRepository.acceptAndUpdateLead,
            ).not.toHaveBeenCalled();
        });
    });

    describe('RejectCotizacionUseCase', () => {
        let useCase: RejectCotizacionUseCase;
        let cotizacionRepository: any;
        let leadRepository: any;

        beforeEach(() => {
            cotizacionRepository = {
                findById: jest.fn(),
                rejectAndUpdateLead: jest.fn(),
            };
            leadRepository = {
                findById: jest.fn(),
                hasPendingActivities: jest
                    .fn<() => Promise<boolean>>()
                    .mockResolvedValue(false),
            };
            useCase = new RejectCotizacionUseCase(
                cotizacionRepository,
                leadRepository,
            );
        });

        it('should reject from ENVIADA and pass expectedEstado to the repository', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.ENVIADA, 5, 50),
            );
            leadRepository.findById.mockResolvedValue({
                id: 50,
                changeState: jest.fn(),
            });
            cotizacionRepository.rejectAndUpdateLead.mockResolvedValue({});

            await useCase.execute(5);

            expect(
                cotizacionRepository.rejectAndUpdateLead,
            ).toHaveBeenCalledWith(
                5,
                50,
                LeadState.CIERRE_SIN_VENTA,
                EstadoCot.ENVIADA,
            );
        });

        it('should throw when the quotation does not exist', async () => {
            cotizacionRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(99)).rejects.toThrow(
                CotizacionNotFoundException,
            );
            expect(
                cotizacionRepository.rejectAndUpdateLead,
            ).not.toHaveBeenCalled();
        });

        it('should throw on invalid transition when already RECHAZADA', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.RECHAZADA),
            );

            await expect(useCase.execute(1)).rejects.toThrow(
                InvalidCotizacionTransitionException,
            );
            expect(leadRepository.findById).not.toHaveBeenCalled();
        });

        it('should throw when the associated lead does not exist', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.PENDIENTE, 1, 10),
            );
            leadRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(1)).rejects.toThrow(
                LeadNotFoundException,
            );
            expect(
                cotizacionRepository.rejectAndUpdateLead,
            ).not.toHaveBeenCalled();
        });

        it('should throw when the lead has pending activities and not close the lead', async () => {
            cotizacionRepository.findById.mockResolvedValue(
                buildCotizacion(EstadoCot.ENVIADA, 5, 50),
            );
            leadRepository.findById.mockResolvedValue({
                id: 50,
                changeState: jest.fn(),
            });
            leadRepository.hasPendingActivities.mockResolvedValue(true);

            await expect(useCase.execute(5)).rejects.toThrow(
                LeadHasPendingActivitiesException,
            );
            expect(leadRepository.hasPendingActivities).toHaveBeenCalledWith(50);
            expect(
                cotizacionRepository.rejectAndUpdateLead,
            ).not.toHaveBeenCalled();
        });
    });
});
