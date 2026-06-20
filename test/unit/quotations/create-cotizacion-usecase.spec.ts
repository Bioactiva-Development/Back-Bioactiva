import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateCotizacionUseCase } from '@/modules/quotations/application/use-cases/create-cotizacion.use-case';
import { CreateCotizacionDto } from '@/modules/quotations/application/dto/create-cotizacion.dto';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadHasPendingActivitiesException } from '@/modules/leads/domain/exceptions/lead-has-pending-activities.exception';
import { CotizacionConflictException } from '@/modules/quotations/domain/exceptions/cotizacion-conflict.exception';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';

const buildLead = (estado: LeadState): Lead =>
    new Lead(
        10,
        'org-1',
        null,
        estado,
        'Desarrollo',
        null,
        null,
        7,
        null,
        3,
        new Date(),
        new Date(),
        null,
        new Date(),
        null,
    );

describe('Quotations module', () => {
    describe('CreateCotizacionUseCase', () => {
        let useCase: CreateCotizacionUseCase;
        let cotizacionRepository: any;
        let leadRepository: any;
        let userRepository: any;

        const dto = new CreateCotizacionDto(
            new Date('2026-06-01T00:00:00.000Z'),
            'Dr. Martinez',
            'TechCorp',
            null,
            'Desarrollo',
            '5000.00',
            'USD',
            null,
            null,
            10,
            7,
            3,
        );

        beforeEach(() => {
            cotizacionRepository = {
                saveWithRelations: jest.fn(),
                count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
            };
            leadRepository = {
                findById: jest.fn(),
                hasPendingActivities: jest.fn(),
                save: jest.fn(),
            };
            userRepository = { findById: jest.fn() };
            useCase = new CreateCotizacionUseCase(
                cotizacionRepository,
                leadRepository,
                userRepository,
            );
        });

        it('throws when the lead does not exist', async () => {
            leadRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
                LeadNotFoundException,
            );
        });

        it('throws when the remitente does not exist', async () => {
            leadRepository.findById.mockResolvedValue({ id: 10 });
            userRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
                UserNotFoundException,
            );
        });

        it('creates a PENDIENTE cotizacion with the remitente full name', async () => {
            leadRepository.findById.mockResolvedValue({ id: 10 });
            userRepository.findById.mockResolvedValue({
                nombres: 'Carlos',
                apellidos: 'López',
            });
            cotizacionRepository.saveWithRelations.mockImplementation(
                async (c: any) => ({ cotizacion: c }),
            );

            await useCase.execute(dto);

            const created =
                cotizacionRepository.saveWithRelations.mock.calls[0][0];
            expect(created.estado).toBe(EstadoCot.PENDIENTE);
            expect(created.nombre_remitente).toBe('Carlos López');
            expect(created.id_lead).toBe(10);
            expect(created.id_remitente).toBe(7);
            expect(created.id_author).toBe(3);
        });

        it('throws when the lead already has a cotizacion and does not create another', async () => {
            leadRepository.findById.mockResolvedValue(
                buildLead(LeadState.OFERTADO),
            );
            userRepository.findById.mockResolvedValue({
                nombres: 'Carlos',
                apellidos: 'López',
            });
            cotizacionRepository.count.mockResolvedValue(1);

            await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
                CotizacionConflictException,
            );

            expect(cotizacionRepository.count).toHaveBeenCalledWith({
                idLead: 10,
            });
            expect(
                cotizacionRepository.saveWithRelations,
            ).not.toHaveBeenCalled();
            expect(leadRepository.save).not.toHaveBeenCalled();
        });

        it('promotes an EN_PROSPECTO lead to OFERTADO when creating the cotizacion', async () => {
            const lead = buildLead(LeadState.EN_PROSPECTO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.hasPendingActivities.mockResolvedValue(false);
            userRepository.findById.mockResolvedValue({
                nombres: 'Carlos',
                apellidos: 'López',
            });
            cotizacionRepository.saveWithRelations.mockImplementation(
                async (c: any) => ({ cotizacion: c }),
            );

            await useCase.execute(dto);

            expect(leadRepository.hasPendingActivities).toHaveBeenCalledWith(10);
            expect(lead.estado).toBe(LeadState.OFERTADO);
            expect(leadRepository.save).toHaveBeenCalledWith(lead);
            expect(cotizacionRepository.saveWithRelations).toHaveBeenCalledTimes(
                1,
            );
        });

        it('throws when the EN_PROSPECTO lead has pending activities and does not create the cotizacion', async () => {
            const lead = buildLead(LeadState.EN_PROSPECTO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.hasPendingActivities.mockResolvedValue(true);
            userRepository.findById.mockResolvedValue({
                nombres: 'Carlos',
                apellidos: 'López',
            });

            await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
                LeadHasPendingActivitiesException,
            );

            expect(lead.estado).toBe(LeadState.EN_PROSPECTO);
            expect(leadRepository.save).not.toHaveBeenCalled();
            expect(
                cotizacionRepository.saveWithRelations,
            ).not.toHaveBeenCalled();
        });

        it('does not change the state nor check activities when the lead is already OFERTADO', async () => {
            const lead = buildLead(LeadState.OFERTADO);
            leadRepository.findById.mockResolvedValue(lead);
            userRepository.findById.mockResolvedValue({
                nombres: 'Carlos',
                apellidos: 'López',
            });
            cotizacionRepository.saveWithRelations.mockImplementation(
                async (c: any) => ({ cotizacion: c }),
            );

            await useCase.execute(dto);

            expect(
                leadRepository.hasPendingActivities,
            ).not.toHaveBeenCalled();
            expect(leadRepository.save).not.toHaveBeenCalled();
            expect(lead.estado).toBe(LeadState.OFERTADO);
            expect(cotizacionRepository.saveWithRelations).toHaveBeenCalledTimes(
                1,
            );
        });
    });
});
