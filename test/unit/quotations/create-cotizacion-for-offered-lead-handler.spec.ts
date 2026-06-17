import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateCotizacionForOfferedLeadHandler } from '@/modules/quotations/application/handlers/create-cotizacion-for-offered-lead.handler';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

describe('Quotations module', () => {
    describe('CreateCotizacionForOfferedLeadHandler', () => {
        let handler: CreateCotizacionForOfferedLeadHandler;
        let cotizacionRepository: any;
        let userRepository: any;
        let organizationRepository: any;
        let configService: any;

        const buildLead = () =>
            new Lead(
                7,
                'org-1',
                null,
                LeadState.OFERTADO,
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

        beforeEach(() => {
            cotizacionRepository = {
                count: jest.fn(),
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
            cotizacionRepository.count.mockResolvedValue(0);
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

            expect(cotizacionRepository.count).toHaveBeenCalledWith({
                idLead: 7,
            });
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

        it('should skip creation when disabled by config flag', async () => {
            configService.get.mockReturnValue('false');

            await handler.handle(buildLead());

            expect(cotizacionRepository.count).not.toHaveBeenCalled();
            expect(
                cotizacionRepository.saveWithRelations,
            ).not.toHaveBeenCalled();
        });

        it('should not create a duplicate when the lead already has quotations', async () => {
            configService.get.mockReturnValue('true');
            cotizacionRepository.count.mockResolvedValue(2);

            await handler.handle(buildLead());

            expect(
                cotizacionRepository.saveWithRelations,
            ).not.toHaveBeenCalled();
        });

        it('should swallow errors so the lead status change is not affected', async () => {
            configService.get.mockReturnValue('true');
            cotizacionRepository.count.mockResolvedValue(0);
            userRepository.findById.mockResolvedValue(null);
            organizationRepository.findById.mockResolvedValue(null);
            cotizacionRepository.saveWithRelations.mockRejectedValue(
                new Error('DB down'),
            );

            await expect(handler.handle(buildLead())).resolves.toBeUndefined();
        });
    });
});
