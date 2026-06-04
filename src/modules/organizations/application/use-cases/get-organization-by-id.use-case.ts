import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { ORGANIZATION_REPOSITORY } from '@/modules/organizations/domain/ports/organization.repository';
import type { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import {
    IContactRepository,
    ContactWithOrgName,
} from '@/modules/contacts/domain/ports/contact.repository';

export const DASHBOARD_CONTACTS_LIMIT = 6;

export interface OrganizationDetail {
    organization: Organization;
    contactos: ContactWithOrgName[];
    totalContactos: number;
}

export class GetOrganizationByIdUseCase {
    constructor(
        @Inject(ORGANIZATION_REPOSITORY)
        private readonly organizationRepository: IOrganizationRepository,
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(id: string): Promise<OrganizationDetail | null> {
        const organization = await this.organizationRepository.findById(id);
        if (!organization) {
            return null;
        }

        const [contactos, totalContactos] = await Promise.all([
            this.contactRepository.list({
                idOrganization: id,
                page: 1,
                limit: DASHBOARD_CONTACTS_LIMIT,
            }),
            this.contactRepository.count({ idOrganization: id }),
        ]);

        return { organization, contactos, totalContactos };
    }
}
