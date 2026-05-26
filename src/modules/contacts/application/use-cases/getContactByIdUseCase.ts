import { Inject } from '@nestjs/common';
import { IContactRepository } from '../../domain/ports/contact.repository';
import { Contact } from '../../domain/entities/contact';
import { ContactNotFoundException } from '../../domain/exceptions/contact-not-found.exception';

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