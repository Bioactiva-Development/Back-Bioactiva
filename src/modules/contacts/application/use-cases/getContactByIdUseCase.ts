import { Inject } from '@nestjs/common';
import { IContactRepository } from '../../domain/ports/contact.repository';
import { Contact } from '../../domain/entities/contact';

export class GetContactByIdUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(id: number): Promise<Contact | null> {
        return await this.contactRepository.findById(id);
    }
}