import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { ListLeadsDto } from '@/modules/leads/application/dto/list-leads.dto';

export class ListLeadsUseCase {
    constructor(
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
    ) {}

    async execute(dto: ListLeadsDto) {
        const { page, limit, ...filters } = dto;
        const [data, total] = await Promise.all([
            this.leadRepository.list({ ...filters, page, limit }),
            this.leadRepository.count(filters),
        ]);
        return { data, total };
    }
}
