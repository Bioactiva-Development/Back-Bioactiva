import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { Organization } from '@/modules/organizations/domain/entities/organization';

export class GetAllOrganizationsUseCase {
    constructor(
        @Inject(IOrganizationRepository)
        private readonly organizationRepository: IOrganizationRepository,
    ) {}

    async execute(): Promise<Organization[]> {
        return await this.organizationRepository.findAll();
    }
}
