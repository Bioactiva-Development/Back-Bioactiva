import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IContactRepository, ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { EmailAlreadyExistsException } from '@/modules/contacts/domain/exceptions/email-already-exists.exception';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';

function toNull(value: string | null | undefined): string | null {
    return value?.trim() ? value : null;
}

export class UpdateContactUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(id: number, dto: Partial<Contact>): Promise<ContactWithOrgName> {
        const contact = await this.contactRepository.findById(id);
        if (!contact) throw new ContactNotFoundException(id);

        if (dto.correo) await this.updateEmail(contact, dto.correo);
        if (dto.correo2) await this.updateSecondaryEmail(contact, dto.correo2);

        if (dto.nombres) contact.nombres = dto.nombres;
        if (dto.apellidos !== undefined) contact.apellidos = toNull(dto.apellidos);
        if (dto.vocativo !== undefined) contact.vocativo = dto.vocativo;
        if (dto.cargo !== undefined) contact.cargo = toNull(dto.cargo);
        if (dto.telefono !== undefined) contact.telefono = toNull(dto.telefono);
        if (dto.correo2 !== undefined) contact.correo2 = toNull(dto.correo2);
        if (dto.comentarios !== undefined) contact.comentarios = toNull(dto.comentarios);

        contact.updatedAt = new Date();

        const saved = await this.contactRepository.save(contact);
        const enriched = await this.contactRepository.findByIdWithOrganization(saved.id);
        return enriched!;
    }

    private async updateEmail(contact: Contact, newCorreo: string): Promise<void> {
        if (newCorreo === contact.correo) return;
        const emailExists = await this.contactRepository.findByEmail(newCorreo);
        if (emailExists) throw new EmailAlreadyExistsException(newCorreo);
        contact.correo = newCorreo;
    }

    private async updateSecondaryEmail(contact: Contact, newCorreo2: string): Promise<void> {
        if (newCorreo2 === contact.correo2) return;
        const email2Exists = await this.contactRepository.findBySecondaryEmail(newCorreo2);
        if (email2Exists) throw new EmailAlreadyExistsException(newCorreo2);
        contact.correo2 = newCorreo2;
    }
}
