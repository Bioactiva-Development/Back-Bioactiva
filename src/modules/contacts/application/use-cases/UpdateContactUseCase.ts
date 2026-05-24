import { Inject } from '@nestjs/common';
import { IContactRepository } from '../../domain/ports/contact.repository';
import { Contact } from '../../domain/entities/contact';
import { EmailAlreadyExistsException } from '../../domain/exceptions/email-already-exists.exception';

export class UpdateContactUseCase {
    constructor(
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
    ) {}

    async execute(id: number, dto: Partial<Contact>): Promise<Contact> {
        const contact = await this.contactRepository.findById(id);
        if (!contact) throw new Error('Contacto no encontrado');

        // No duplicidad
        if (dto.correo && dto.correo !== contact.correo) {
            const emailExists = await this.contactRepository.findByEmail(dto.correo);
            if (emailExists) throw new EmailAlreadyExistsException(dto.correo);
            contact.changeEmail(dto.correo);
        }

        // Mutar los campos permitidos
        if (dto.nombres) contact.nombres = dto.nombres;
        if (dto.apellidos !== undefined) contact.apellidos = dto.apellidos;
        if (dto.vocativo !== undefined) contact.vocativo = dto.vocativo;
        if (dto.cargo !== undefined) contact.cargo = dto.cargo;
        if (dto.telefono !== undefined) contact.telefono = dto.telefono;
        if (dto.correo2 !== undefined) contact.correo2 = dto.correo2;
        if (dto.comentarios !== undefined) contact.comentarios = dto.comentarios;
        
        contact.updatedAt = new Date();

        return await this.contactRepository.save(contact);
    }
}