import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DeleteLeadUseCase } from '@/modules/leads/application/use-cases/delete-lead.use-case';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';

describe('Leads module', () => {
    describe('DeleteLeadUseCase', () => {
        let useCase: DeleteLeadUseCase;
        let leadRepository: any;

        const buildLead = () =>
            new Lead(
                1,
                'org-1',
                null,
                LeadState.EN_PROSPECTO,
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
                save: jest.fn(),
            };

            useCase = new DeleteLeadUseCase(leadRepository);
        });

        it('should soft delete a lead', async () => {
            const lead = buildLead();
            leadRepository.findById.mockResolvedValue(lead);
            leadRepository.save.mockResolvedValue(lead);

            const result = await useCase.execute(1);

            expect(lead.deleted_at).toBeInstanceOf(Date);
            expect(leadRepository.save).toHaveBeenCalledWith(lead);
            expect(result).toEqual({ ok: true });
        });

        it('should throw when lead is not found', async () => {
            leadRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toThrow(
                LeadNotFoundException,
            );
        });
    });
});
