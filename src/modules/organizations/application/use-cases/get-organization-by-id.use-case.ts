import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { Organization } from '@/modules/organizations/domain/entities/organization';

export class GetOrganizationByIdUseCase {
    constructor(
        @Inject(IOrganizationRepository)
        private readonly organizationRepository: IOrganizationRepository,
    ) {}

    async execute(id: string): Promise<Organization | null> {
        return await this.organizationRepository.findById(id);
    }
}
