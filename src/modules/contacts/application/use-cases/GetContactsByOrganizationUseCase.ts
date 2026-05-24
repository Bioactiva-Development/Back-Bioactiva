import { Inject } from '@nestjs/common';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
import { Contact } from '@/modules/contacts/domain/entities/contact';

export class GetContactsByOrganizationUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    // poruqe la busqueda puede demorar y si no le damos le tiempo de espera, esta se cae
    async execute(idOrganization: string): Promise<Contact[]> {
        const variable =
            this.contactRepository.findByOrganizationId(idOrganization);
        return variable;
        //observacion : la implementacion es equivalente. 
        // return await this.contactRepository.findByOrganizationId(idOrganization);
    }
}
