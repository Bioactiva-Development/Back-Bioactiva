import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IContactRepository, ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { EmailAlreadyExistsException } from '@/modules/contacts/domain/exceptions/email-already-exists.exception';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';

export class UpdateContactUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(id: number, dto: Partial<Contact>): Promise<ContactWithOrgName> {
        const contact = await this.contactRepository.findById(id);
        if (!contact) throw new ContactNotFoundException(id);

        if (dto.correo && dto.correo !== contact.correo) {
            const emailExists = await this.contactRepository.findByEmail(
                dto.correo,
            );
            if (emailExists) throw new EmailAlreadyExistsException(dto.correo);
            contact.correo = dto.correo;
        }

        if (dto.correo2 && dto.correo2 !== contact.correo2) {
            const email2Exists =
                await this.contactRepository.findBySecondaryEmail(dto.correo2);
            if (email2Exists)
                throw new EmailAlreadyExistsException(dto.correo2);
            contact.correo2 = dto.correo2;
        }

        if (dto.nombres) contact.nombres = dto.nombres;
        if (dto.apellidos !== undefined) contact.apellidos = dto.apellidos;
        if (dto.vocativo !== undefined) contact.vocativo = dto.vocativo;
        if (dto.cargo !== undefined) contact.cargo = dto.cargo;
        if (dto.telefono !== undefined) contact.telefono = dto.telefono;
        if (dto.correo2 !== undefined) contact.correo2 = dto.correo2;
        if (dto.comentarios !== undefined)
            contact.comentarios = dto.comentarios;

        contact.updatedAt = new Date();

        const saved = await this.contactRepository.save(contact);
        const enriched = await this.contactRepository.findByIdWithOrganization(saved.id);
        return enriched!;
    }
}
