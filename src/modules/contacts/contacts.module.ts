import { Module } from '@nestjs/common';
import { ContactController } from '@/modules/contacts/infrastructure/http/contact.controller';
import { PrismaContactRepository } from '@/modules/contacts/infrastructure/persistence/prisma-contact.repository';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
import { CreateContactUseCase } from '@/modules/contacts/application/use-cases/create-contact.use-case';
import { UpdateContactUseCase } from '@/modules/contacts/application/use-cases/update-contact.use-case';
import { GetContactByIdUseCase } from '@/modules/contacts/application/use-cases/get-contact-by-id.use-case';
import { GetAllContactsUseCase } from '@/modules/contacts/application/use-cases/get-all-contacts.use-case';
import { GetContactsByOrganizationUseCase } from '@/modules/contacts/application/use-cases/get-contacts-by-organization.use-case';

@Module({
    controllers: [ContactController],
    providers: [
        PrismaContactRepository,
        {
            provide: IContactRepository,
            useExisting: PrismaContactRepository,
        },
        CreateContactUseCase,
        UpdateContactUseCase,
        GetContactByIdUseCase,
        GetAllContactsUseCase,
        GetContactsByOrganizationUseCase,
    ],
    exports: [
        IContactRepository,
        CreateContactUseCase,
        UpdateContactUseCase,
        GetContactByIdUseCase,
        GetAllContactsUseCase,
        GetContactsByOrganizationUseCase,
    ],
})
export class ContactsModule {}
