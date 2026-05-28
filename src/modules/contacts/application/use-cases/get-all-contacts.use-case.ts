import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IContactRepository, ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';

export class GetAllContactsUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(): Promise<ContactWithOrgName[]> {
        return await this.contactRepository.findAllWithOrganization();
    }
}
