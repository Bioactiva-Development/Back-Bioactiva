import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetLeadByIdUseCase } from '@/modules/leads/application/use-cases/get-lead-by-id.use-case';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';

describe('Leads module', () => {
    describe('GetLeadByIdUseCase', () => {
        let useCase: GetLeadByIdUseCase;
        let leadRepository: any;

        beforeEach(() => {
            leadRepository = {
                findByIdWithRelations: jest.fn(),
            };

            useCase = new GetLeadByIdUseCase(leadRepository);
        });

        it('should return lead when found', async () => {
            const expectedLead = { id: 1, estado: 'EN_PROSPECTO' };
            leadRepository.findByIdWithRelations.mockResolvedValue(
                expectedLead,
            );

            const result = await useCase.execute(1);

            expect(result).toBe(expectedLead);
            expect(leadRepository.findByIdWithRelations).toHaveBeenCalledWith(
                1,
            );
        });

        it('should throw when lead is not found', async () => {
            leadRepository.findByIdWithRelations.mockResolvedValue(null);

            await expect(useCase.execute(999)).rejects.toThrow(
                LeadNotFoundException,
            );
        });
    });
});
