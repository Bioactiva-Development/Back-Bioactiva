import { Inject } from '@nestjs/common';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
import { Contact } from '@/modules/contacts/domain/entities/contact';

export class GetContactsByOrganizationUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(idOrganization: string): Promise<Contact[]> {
        return this.contactRepository.findByOrganizationId(idOrganization);
    }
}
