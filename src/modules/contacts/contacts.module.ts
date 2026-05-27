import { Module } from '@nestjs/common';
import { ContactController } from './infrastructure/controllers/contact.controller';
import { PrismaContactRepository } from './infrastructure/persistence/prisma-contact.repository';
import { IContactRepository } from './domain/ports/contact.repository';
import {
    CreateContactUseCase,
    UpdateContactUseCase,
    GetContactByIdUseCase,
    GetAllContactsUseCase,
    GetContactsByOrganizationUseCase,
} from './application/use-cases';

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
