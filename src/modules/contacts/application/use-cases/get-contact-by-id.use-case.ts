import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';

export class GetContactByIdUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(id: number): Promise<Contact> {
        const contact = await this.contactRepository.findById(id);
        if (!contact) throw new ContactNotFoundException(id);
        return contact;
    }
}
