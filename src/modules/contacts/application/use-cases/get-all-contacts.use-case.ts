import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
import { Contact } from '@/modules/contacts/domain/entities/contact';

export class GetAllContactsUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(): Promise<Contact[]> {
        return await this.contactRepository.findAll();
    }
}
