import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { ORGANIZATION_REPOSITORY } from '@/modules/organizations/domain/ports/organization.repository';
import type { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { Organization } from '@/modules/organizations/domain/entities/organization';

export class GetOrganizationByIdUseCase {
    constructor(
        @Inject(ORGANIZATION_REPOSITORY)
        private readonly organizationRepository: IOrganizationRepository,
    ) {}

    async execute(id: string): Promise<Organization | null> {
        return await this.organizationRepository.findById(id);
    }
}
