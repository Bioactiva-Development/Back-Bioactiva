import { Inject } from '@/shared/dependency-inyection/inyect';
import { IOrganizationRepository } from '../../domain/ports/organization.repository';
import { Organization } from '../../domain/entities/organization';

export class GetAllOrganizationsUseCase {
    constructor(
        @Inject(IOrganizationRepository)
        private readonly organizationRepository: IOrganizationRepository,
    ) {}

    async execute(): Promise<Organization[]> {
        return await this.organizationRepository.findAll();
    }
}
