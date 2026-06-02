import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ContactController } from '@/modules/contacts/infrastructure/http/contact.controller';
import { CreateContactUseCase } from '@/modules/contacts/application/use-cases/create-contact.use-case';
import { UpdateContactUseCase } from '@/modules/contacts/application/use-cases/update-contact.use-case';
import { GetContactByIdUseCase } from '@/modules/contacts/application/use-cases/get-contact-by-id.use-case';
import { GetAllContactsUseCase } from '@/modules/contacts/application/use-cases/get-all-contacts.use-case';
import { GetContactsByOrganizationUseCase } from '@/modules/contacts/application/use-cases/get-contacts-by-organization.use-case';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('ContactController', () => {
    let controller: ContactController;
    let createContactUseCase: jest.Mocked<CreateContactUseCase>;
    let updateContactUseCase: jest.Mocked<UpdateContactUseCase>;
    let getContactByIdUseCase: jest.Mocked<GetContactByIdUseCase>;
    let getAllContactsUseCase: jest.Mocked<GetAllContactsUseCase>;
    let getContactsByOrgUseCase: jest.Mocked<GetContactsByOrganizationUseCase>;

    const mockUser = new User(1, 'Admin', 'User', 'admin@test.com', 'hash', new Date(), UserRole.ADMINISTRADOR, UserState.ACTIVO, new Date());

    const mockContact = new Contact(1, 'Juan', 'Perez', Vocative.SR, 'Manager', 'juan@test.com', '999888777', null, 'Test', 'org-1', 1, new Date(), new Date());

    const enrichedContact = { contact: mockContact, organizationName: 'Org A' };

    beforeEach(async () => {
        createContactUseCase = { execute: jest.fn() } as any;
        updateContactUseCase = { execute: jest.fn() } as any;
        getContactByIdUseCase = { execute: jest.fn() } as any;
        getAllContactsUseCase = { execute: jest.fn() } as any;
        getContactsByOrgUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [ContactController],
            providers: [
                { provide: CreateContactUseCase, useValue: createContactUseCase },
                { provide: UpdateContactUseCase, useValue: updateContactUseCase },
                { provide: GetContactByIdUseCase, useValue: getContactByIdUseCase },
                { provide: GetAllContactsUseCase, useValue: getAllContactsUseCase },
                { provide: GetContactsByOrganizationUseCase, useValue: getContactsByOrgUseCase },
            ],
        }).compile();

        controller = module.get(ContactController);
    });

    it('should create a contact', async () => {
        createContactUseCase.execute.mockResolvedValue(enrichedContact);

        const dto = { nombres: 'Juan', apellidos: 'Perez', correo: 'juan@test.com', idOrganizacion: 'org-1' } as any;
        const result = await controller.create(dto, mockUser);

        expect(createContactUseCase.execute).toHaveBeenCalled();
        expect(result.nombres).toBe('Juan');
    });

    it('should find all contacts', async () => {
        getAllContactsUseCase.execute.mockResolvedValue([enrichedContact]);

        const result = await controller.findAll();

        expect(result).toHaveLength(1);
        expect(result[0].nombres).toBe('Juan');
    });

    it('should find contacts by organization', async () => {
        getContactsByOrgUseCase.execute.mockResolvedValue([enrichedContact]);

        const result = await controller.findByOrganization('org-1');

        expect(result).toHaveLength(1);
        expect(getContactsByOrgUseCase.execute).toHaveBeenCalledWith('org-1');
    });

    it('should find one contact by id', async () => {
        getContactByIdUseCase.execute.mockResolvedValue(enrichedContact);

        const result = await controller.findOne(1);

        expect(result.nombres).toBe('Juan');
        expect(getContactByIdUseCase.execute).toHaveBeenCalledWith(1);
    });

    it('should update a contact', async () => {
        const updatedContact = { contact: { ...mockContact, nombres: 'Jane' }, organizationName: 'Org A' };
        updateContactUseCase.execute.mockResolvedValue(updatedContact);

        const dto = { nombres: 'Jane' } as any;
        const result = await controller.update(1, dto);

        expect(updateContactUseCase.execute).toHaveBeenCalledWith(1, dto);
        expect(result.nombres).toBe('Jane');
    });
});
