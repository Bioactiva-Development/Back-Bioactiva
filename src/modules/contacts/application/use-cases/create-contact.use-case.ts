import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IContactRepository, ContactWithOrgName } from '@/modules/contacts/domain/ports/contact.repository';
import { CreateContactDto } from '@/modules/contacts/application/dtos/create-contact.dto';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { EmailAlreadyExistsException } from '@/modules/contacts/domain/exceptions/email-already-exists.exception';

export class CreateContactUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(dto: CreateContactDto): Promise<ContactWithOrgName> {
        const existingContact = await this.contactRepository.findByEmail(
            dto.correo,
        );
        if (existingContact) {
            throw new EmailAlreadyExistsException(dto.correo);
        }

        if (dto.correo2) {
            const existingContact2 =
                await this.contactRepository.findBySecondaryEmail(dto.correo2);
            if (existingContact2) {
                throw new EmailAlreadyExistsException(dto.correo2);
            }
        }

        const newContact = new Contact(
            0,
            dto.nombres,
            dto.apellidos,
            dto.vocativo,
            dto.cargo,
            dto.correo,
            dto.telefono,
            dto.correo2,
            dto.comentarios,
            dto.idOrganizacion,
            dto.idAuthor,
            new Date(),
            new Date(),
        );

        const saved = await this.contactRepository.save(newContact);
        const enriched = await this.contactRepository.findByIdWithOrganization(saved.id);
        return enriched!;
    }
}
