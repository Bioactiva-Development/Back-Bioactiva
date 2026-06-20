import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { ORGANIZATION_REPOSITORY } from '@/modules/organizations/domain/ports/organization.repository';
import type { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { ListOrganizationsDto } from '@/modules/organizations/application/dto/list-organizations.dto';

export interface GetAllOrganizationsResult {
    data: Organization[];
    total: number;
}

export class GetAllOrganizationsUseCase {
    constructor(
        @Inject(ORGANIZATION_REPOSITORY)
        private readonly organizationRepository: IOrganizationRepository,
    ) {}

    async execute(
        dto: ListOrganizationsDto = new ListOrganizationsDto(),
    ): Promise<GetAllOrganizationsResult> {
        const { page, limit, ...filters } = dto;
        const [data, total] = await Promise.all([
            this.organizationRepository.findAll({ ...filters, page, limit }),
            this.organizationRepository.countAll(filters),
        ]);
        return { data, total };
    }
}
