import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ChangeLeadStatusUseCase } from '@/modules/leads/application/use-cases/change-lead-status.use-case';
import { ChangeLeadStatusDto } from '@/modules/leads/application/dto/change-lead-status.dto';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadHasPendingActivitiesException } from '@/modules/leads/domain/exceptions/lead-has-pending-activities.exception';
import { InvalidLeadTransitionException } from '@/modules/leads/domain/exceptions/invalid-lead-transition.exception';

describe('Leads module', () => {
    describe('ChangeLeadStatusUseCase', () => {
        let useCase: ChangeLeadStatusUseCase;
        let leadRepository: any;
        let offeredLeadHandler: any;

        const buildLead = (estado: LeadState = LeadState.EN_PROSPECTO) =>
            new Lead(
                1,
                'org-1',
                null,
                estado,
                'Consultoría',
                null,
                null,
                null,
                1,
                null,
                1,
                new Date(),
                new Date(),
                null,
                new Date(),
            );

        beforeEach(() => {
            leadRepository = {
                findById: jest.fn(),
                saveWithRelations: jest.fn(),
                hasPendingActivities: jest.fn(() => Promise.resolve(false)),
            };
            offeredLeadHandler = { handle: jest.fn() };

            useCase = new ChangeLeadStatusUseCase(
                leadRepository,
                offeredLeadHandler,
            );
        });

        it('should change lead status', async () => {
            const lead = buildLead();
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.saveWithRelations.mockResolvedValue(lead);

            const dto = new ChangeLeadStatusDto(LeadState.OFERTADO);
            await useCase.execute(1, dto);

            expect(lead.estado).toBe(LeadState.OFERTADO);
            expect(leadRepository.saveWithRelations).toHaveBeenCalledWith(lead);
        });

        it('should notify the offered-lead handler when entering OFERTADO', async () => {
            const lead = buildLead(LeadState.EN_PROSPECTO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.saveWithRelations.mockResolvedValue(lead);

            await useCase.execute(1, new ChangeLeadStatusDto(LeadState.OFERTADO));

            expect(offeredLeadHandler.handle).toHaveBeenCalledWith(lead);
        });

        it('should NOT notify the handler when the lead was already OFERTADO', async () => {
            const lead = buildLead(LeadState.OFERTADO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.saveWithRelations.mockResolvedValue(lead);

            await useCase.execute(1, new ChangeLeadStatusDto(LeadState.OFERTADO));

            expect(offeredLeadHandler.handle).not.toHaveBeenCalled();
        });

        it('should notify the handler on closure transitions to sync the cotización', async () => {
            const lead = buildLead(LeadState.OFERTADO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.saveWithRelations.mockResolvedValue(lead);

            await useCase.execute(
                1,
                new ChangeLeadStatusDto(LeadState.CIERRE_CON_VENTA),
            );

            expect(offeredLeadHandler.handle).toHaveBeenCalledWith(lead);
        });

        it('should move freely between the post-prospecto states', async () => {
            const lead = buildLead(LeadState.OFERTADO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.saveWithRelations.mockResolvedValue(lead);

            await useCase.execute(
                1,
                new ChangeLeadStatusDto(LeadState.CIERRE_CON_VENTA),
            );
            expect(lead.estado).toBe(LeadState.CIERRE_CON_VENTA);

            await useCase.execute(
                1,
                new ChangeLeadStatusDto(LeadState.CIERRE_SIN_VENTA),
            );
            expect(lead.estado).toBe(LeadState.CIERRE_SIN_VENTA);

            await useCase.execute(
                1,
                new ChangeLeadStatusDto(LeadState.OFERTADO),
            );
            expect(lead.estado).toBe(LeadState.OFERTADO);
        });

        it('should reject an invalid transition (back to EN_PROSPECTO) without checking pending activities', async () => {
            const lead = buildLead(LeadState.OFERTADO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.hasPendingActivities.mockResolvedValue(true);

            await expect(
                useCase.execute(
                    1,
                    new ChangeLeadStatusDto(LeadState.EN_PROSPECTO),
                ),
            ).rejects.toThrow(InvalidLeadTransitionException);

            expect(lead.estado).toBe(LeadState.OFERTADO);
            expect(leadRepository.hasPendingActivities).not.toHaveBeenCalled();
            expect(leadRepository.saveWithRelations).not.toHaveBeenCalled();
        });

        it('should reject closing a lead directly from EN_PROSPECTO', async () => {
            const lead = buildLead(LeadState.EN_PROSPECTO);
            leadRepository.findById.mockResolvedValue(lead);

            await expect(
                useCase.execute(
                    1,
                    new ChangeLeadStatusDto(LeadState.CIERRE_CON_VENTA),
                ),
            ).rejects.toThrow(InvalidLeadTransitionException);

            expect(lead.estado).toBe(LeadState.EN_PROSPECTO);
            expect(leadRepository.saveWithRelations).not.toHaveBeenCalled();
        });

        it('should block any state change when the lead has pending activities', async () => {
            const lead = buildLead(LeadState.EN_PROSPECTO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.hasPendingActivities.mockResolvedValue(true);

            await expect(
                useCase.execute(1, new ChangeLeadStatusDto(LeadState.OFERTADO)),
            ).rejects.toThrow(LeadHasPendingActivitiesException);

            expect(lead.estado).toBe(LeadState.EN_PROSPECTO);
            expect(leadRepository.saveWithRelations).not.toHaveBeenCalled();
            expect(offeredLeadHandler.handle).not.toHaveBeenCalled();
        });

        it('should NOT check pending activities when the state does not change', async () => {
            const lead = buildLead(LeadState.OFERTADO);
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.saveWithRelations.mockResolvedValue(lead);
            leadRepository.hasPendingActivities.mockResolvedValue(true);

            await useCase.execute(1, new ChangeLeadStatusDto(LeadState.OFERTADO));

            expect(leadRepository.hasPendingActivities).not.toHaveBeenCalled();
            expect(leadRepository.saveWithRelations).toHaveBeenCalledWith(lead);
        });

        it('should throw when lead is not found', async () => {
            leadRepository.findById.mockResolvedValue(null);

            const dto = new ChangeLeadStatusDto(LeadState.OFERTADO);
            await expect(useCase.execute(999, dto)).rejects.toThrow(
                LeadNotFoundException,
            );
        });
    });
});
