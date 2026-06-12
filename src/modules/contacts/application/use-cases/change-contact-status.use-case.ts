import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    IContactRepository,
    ContactWithOrgName,
} from '@/modules/contacts/domain/ports/contact.repository';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';

export class ChangeContactStatusUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(
        id: number,
        estado: EstadoCorreo,
    ): Promise<ContactWithOrgName> {
        const contact = await this.contactRepository.findById(id);
        if (!contact) throw new ContactNotFoundException(id);

        if (estado === EstadoCorreo.VENCIDO) {
            contact.markExpired();
        } else {
            contact.markActive();
        }

        await this.contactRepository.save(contact);
        const enriched =
            await this.contactRepository.findByIdWithOrganization(id);
        return enriched!;
    }
}
