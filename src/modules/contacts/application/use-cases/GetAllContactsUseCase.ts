import { Inject } from '@nestjs/common';
import { IContactRepository } from '../../domain/ports/contact.repository';
import { Contact } from '../../domain/entities/contact';

export class GetAllContactsUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(): Promise<Contact[]> {
        return await this.contactRepository.findAll();
    }
}