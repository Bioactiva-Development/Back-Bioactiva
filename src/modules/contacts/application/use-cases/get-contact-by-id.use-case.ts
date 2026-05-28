import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IContactRepository, ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';

export class GetContactByIdUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(id: number): Promise<ContactWithOrgName> {
        const enriched = await this.contactRepository.findByIdWithOrganization(id);
        if (!enriched) throw new ContactNotFoundException(id);
        return enriched;
    }
}
