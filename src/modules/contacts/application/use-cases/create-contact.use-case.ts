import { Inject } from '@nestjs/common';
import { IContactRepository } from '../../domain/ports/contact.repository';
import { CreateContactDto } from '../dtos/create-contact.dto';
import { Contact } from '../../domain/entities/contact';
import { EmailAlreadyExistsException } from '../../domain/exceptions/email-already-exists.exception';

export class CreateContactUseCase {
    // 1. Inyección del puerto (abstracción), no de la tecnología
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(dto: CreateContactDto): Promise<Contact> {
        // 2. Aplicar regla de negocio: Validar unicidad del correo principal
        const existingContact = await this.contactRepository.findByEmail(
            dto.correo,
        );
        if (existingContact) {
            throw new EmailAlreadyExistsException(dto.correo);
        }

        // Validar unicidad del correo secundario si se proporciona
        if (dto.correo2) {
            const existingContact2 = await this.contactRepository.findBySecondaryEmail(
                dto.correo2,
            );
            if (existingContact2) {
                throw new EmailAlreadyExistsException(dto.correo2);
            }
        }

        // 3. Instanciar la entidad de dominio con datos limpios
        const newContact = new Contact(
            0, // El ID se envía en 0; Prisma lo autogenerará en la BD
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
            new Date(), // createdAt
            new Date(), // updatedAt
        );

        // 4. Persistir a través del puerto y retornar la entidad creada
        return await this.contactRepository.save(newContact);
    }
}
