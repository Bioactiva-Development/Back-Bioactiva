import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';

export class GetLeadByIdUseCase {
    constructor(
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
    ) {}

    async execute(id: number) {
        const lead = await this.leadRepository.findByIdWithRelations(id);
        if (!lead) {
            throw new LeadNotFoundException(`Lead con id ${id} no encontrado`);
        }
        return lead;
    }
}
