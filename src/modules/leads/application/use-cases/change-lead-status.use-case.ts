import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { ChangeLeadStatusDto } from '@/modules/leads/application/dto/change-lead-status.dto';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';

export class ChangeLeadStatusUseCase {
    constructor(
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
    ) {}

    async execute(id: number, dto: ChangeLeadStatusDto) {
        const lead = await this.leadRepository.findById(id);
        if (!lead) {
            throw new LeadNotFoundException(`Lead con id ${id} no encontrado`);
        }

        lead.changeState(dto.estado);

        return await this.leadRepository.saveWithRelations(lead);
    }
}
