import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    IContactRepository,
    ContactWithOrgName,
} from '@/modules/contacts/domain/ports/contact.repository';
import { ListContactsDto } from '@/modules/contacts/application/dtos/list-contacts.dto';

export class GetAllContactsUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(
        dto: ListContactsDto = new ListContactsDto(),
    ): Promise<{ data: ContactWithOrgName[]; total: number }> {
        const { page, limit, ...filters } = dto;
        const [data, total] = await Promise.all([
            this.contactRepository.list({ ...filters, page, limit }),
            this.contactRepository.count(filters),
        ]);
        return { data, total };
    }
}
