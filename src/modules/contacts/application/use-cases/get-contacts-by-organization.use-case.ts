import { Inject } from '@nestjs/common';
import { IContactRepository, ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';

export class GetContactsByOrganizationUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(idOrganization: string): Promise<ContactWithOrgName[]> {
        return this.contactRepository.findByOrganizationIdWithOrganization(idOrganization);
    }
}
