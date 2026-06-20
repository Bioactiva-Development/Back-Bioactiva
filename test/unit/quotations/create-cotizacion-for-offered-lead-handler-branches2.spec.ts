import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateCotizacionForOfferedLeadHandler } from '@/modules/quotations/application/handlers/create-cotizacion-for-offered-lead.handler';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

/**
 * Branch coverage extra:
 * `error instanceof Error ? error.stack : String(error)` -> rama String(error)
 * cuando una dependencia lanza un valor que NO es Error.
 */
describe('Quotations module — CreateCotizacionForOfferedLeadHandler branches2', () => {
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
            3,
            null,
            9,
            new Date(),
            new Date(),
            null,
            new Date(),
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

    it('swallows a non-Error rejection (String(error) branch)', async () => {
        configService.get.mockReturnValue(undefined); // habilitado
        // findByLead lanza un valor no-Error -> entra al catch con String(error).
        cotizacionRepository.findByLead.mockImplementation(() => {
            throw 'fallo-no-error';
        });

        await expect(handler.handle(buildLead())).resolves.toBeUndefined();
        expect(cotizacionRepository.saveWithRelations).not.toHaveBeenCalled();
    });
});
