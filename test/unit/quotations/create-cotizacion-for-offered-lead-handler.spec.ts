import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateCotizacionForOfferedLeadHandler } from '@/modules/quotations/application/handlers/create-cotizacion-for-offered-lead.handler';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

describe('Quotations module', () => {
    describe('CreateCotizacionForOfferedLeadHandler', () => {
        let handler: CreateCotizacionForOfferedLeadHandler;
        let cotizacionRepository: any;
        let userRepository: any;
        let organizationRepository: any;
        let configService: any;

        const buildLead = (estado: LeadState = LeadState.OFERTADO) =>
            new Lead(
                7,
                'org-1',
                null,
                estado,
                'Consultoría I+D',
                null,
                null,
                3, // id_encargado
                null,
                9, // id_author
                new Date(),
                new Date(),
                null,
                new Date(),
            );

        const buildCotizacion = (estado: EstadoCot) =>
            new Cotizacion(
                55,
                new Date(),
                'TechCorp',
                'TechCorp SA',
                null,
                'Ana Paredes',
                'Consultoría I+D',
                '0.00',
                TipoMoneda.PEN,
                estado,
                null,
                null,
                7,
                3,
                9,
                new Date(),
                new Date(),
                null,
            );

        beforeEach(() => {
            cotizacionRepository = {
                findByLead: jest.fn(),
                save: jest.fn(),
                saveWithRelations: jest.fn(),
            };
            userRepository = { findById: jest.fn() };
            organizationRepository = { findById: jest.fn() };
            configService = { get: jest.fn() };

            handler = new CreateCotizacionForOfferedLeadHandler(
                cotizacionRepository,
                userRepository,
                organizationRepository,
                configService,
            );
        });

        it('should create a PENDIENTE draft prefilled from the lead and organization', async () => {
            configService.get.mockReturnValue(undefined); // habilitado por defecto
            cotizacionRepository.findByLead.mockResolvedValue(null);
            userRepository.findById.mockResolvedValue({
                nombres: 'Ana',
                apellidos: 'Paredes',
            });
            organizationRepository.findById.mockResolvedValue({
                nombre: 'TechCorp SA',
                nombreComercial: 'TechCorp',
            });
            cotizacionRepository.saveWithRelations.mockResolvedValue({});

            await handler.handle(buildLead());

            expect(cotizacionRepository.findByLead).toHaveBeenCalledWith(7);
            const created =
                cotizacionRepository.saveWithRelations.mock.calls[0][0];
            expect(created.estado).toBe(EstadoCot.PENDIENTE);
            expect(created.tipo).toBe(TipoMoneda.PEN);
            expect(created.monto).toBe('0.00');
            expect(created.id_lead).toBe(7);
            expect(created.id_remitente).toBe(3);
            expect(created.id_author).toBe(9);
            expect(created.nombre_servicio).toBe('Consultoría I+D');
            expect(created.nombre_remitente).toBe('Ana Paredes');
            expect(created.dirigido).toBe('TechCorp');
            expect(created.cliente).toBe('TechCorp SA');
        });

        it('should skip draft creation when disabled by config flag', async () => {
            configService.get.mockReturnValue('false');
            cotizacionRepository.findByLead.mockResolvedValue(null);

            await handler.handle(buildLead());

            expect(
                cotizacionRepository.saveWithRelations,
            ).not.toHaveBeenCalled();
            expect(cotizacionRepository.save).not.toHaveBeenCalled();
        });

        it('should not create a draft when the lead is not OFERTADO and has no cotización', async () => {
            configService.get.mockReturnValue('true');
            cotizacionRepository.findByLead.mockResolvedValue(null);

            await handler.handle(buildLead(LeadState.CIERRE_SIN_VENTA));

            expect(
                cotizacionRepository.saveWithRelations,
            ).not.toHaveBeenCalled();
            expect(cotizacionRepository.save).not.toHaveBeenCalled();
        });

        it('should accept the existing cotización when the lead closes with sale', async () => {
            const existing = buildCotizacion(EstadoCot.ENVIADA);
            cotizacionRepository.findByLead.mockResolvedValue(existing);
            cotizacionRepository.save.mockResolvedValue(existing);

            await handler.handle(buildLead(LeadState.CIERRE_CON_VENTA));

            expect(existing.estado).toBe(EstadoCot.ACEPTADA);
            expect(cotizacionRepository.save).toHaveBeenCalledWith(existing);
            expect(
                cotizacionRepository.saveWithRelations,
            ).not.toHaveBeenCalled();
        });

        it('should reject the existing cotización when the lead closes without sale', async () => {
            const existing = buildCotizacion(EstadoCot.PENDIENTE);
            cotizacionRepository.findByLead.mockResolvedValue(existing);
            cotizacionRepository.save.mockResolvedValue(existing);

            await handler.handle(buildLead(LeadState.CIERRE_SIN_VENTA));

            expect(existing.estado).toBe(EstadoCot.RECHAZADA);
            expect(cotizacionRepository.save).toHaveBeenCalledWith(existing);
        });

        it('should reopen the existing cotización to PENDIENTE when the lead returns to OFERTADO', async () => {
            const existing = buildCotizacion(EstadoCot.ACEPTADA);
            cotizacionRepository.findByLead.mockResolvedValue(existing);
            cotizacionRepository.save.mockResolvedValue(existing);

            await handler.handle(buildLead(LeadState.OFERTADO));

            expect(existing.estado).toBe(EstadoCot.PENDIENTE);
            expect(cotizacionRepository.save).toHaveBeenCalledWith(existing);
            // No se genera un borrador nuevo si ya hay cotización.
            expect(
                cotizacionRepository.saveWithRelations,
            ).not.toHaveBeenCalled();
        });

        it('should not persist when the existing cotización already matches the lead state', async () => {
            const existing = buildCotizacion(EstadoCot.ACEPTADA);
            cotizacionRepository.findByLead.mockResolvedValue(existing);

            await handler.handle(buildLead(LeadState.CIERRE_CON_VENTA));

            expect(cotizacionRepository.save).not.toHaveBeenCalled();
        });

        it('should do nothing when the lead has no id', async () => {
            const lead = buildLead();
            (lead as any).id = null;

            await handler.handle(lead);

            expect(cotizacionRepository.findByLead).not.toHaveBeenCalled();
        });

        it('should swallow errors so the lead status change is not affected', async () => {
            configService.get.mockReturnValue('true');
            cotizacionRepository.findByLead.mockResolvedValue(null);
            userRepository.findById.mockResolvedValue(null);
            organizationRepository.findById.mockResolvedValue(null);
            cotizacionRepository.saveWithRelations.mockRejectedValue(
                new Error('DB down'),
            );

            await expect(handler.handle(buildLead())).resolves.toBeUndefined();
        });
    });
});
