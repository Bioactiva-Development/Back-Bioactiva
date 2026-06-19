import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ContactController } from '@/modules/contacts/infrastructure/http/contact.controller';
import { CreateContactUseCase } from '@/modules/contacts/application/use-cases/create-contact.use-case';
import { UpdateContactUseCase } from '@/modules/contacts/application/use-cases/update-contact.use-case';
import { GetContactByIdUseCase } from '@/modules/contacts/application/use-cases/get-contact-by-id.use-case';
import { GetAllContactsUseCase } from '@/modules/contacts/application/use-cases/get-all-contacts.use-case';
import { GetContactsByOrganizationUseCase } from '@/modules/contacts/application/use-cases/get-contacts-by-organization.use-case';
import { ChangeContactStatusUseCase } from '@/modules/contacts/application/use-cases/change-contact-status.use-case';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('ContactController (optional-field branches)', () => {
    let controller: ContactController;
    let createContactUseCase: jest.Mocked<CreateContactUseCase>;

    const mockUser = new User(
        1,
        'Admin',
        'User',
        'admin@test.com',
        'hash',
        new Date(),
        UserRole.ADMINISTRADOR,
        UserState.ACTIVO,
        new Date(),
    );

    const mockContact = new Contact(
        1,
        'Juan',
        'Perez',
        Vocative.SR,
        'Manager',
        'juan@test.com',
        '999888777',
        null,
        'Test',
        'org-1',
        1,
        new Date(),
        new Date(),
    );

    const enrichedContact = { contact: mockContact, organizationName: 'Org A' };

    beforeEach(async () => {
        createContactUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [ContactController],
            providers: [
                {
                    provide: CreateContactUseCase,
                    useValue: createContactUseCase,
                },
                {
                    provide: UpdateContactUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: GetContactByIdUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: GetAllContactsUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: GetContactsByOrganizationUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: ChangeContactStatusUseCase,
                    useValue: { execute: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get(ContactController);
    });

    it('create maps every optional field when all are present', async () => {
        createContactUseCase.execute.mockResolvedValue(enrichedContact);

        const httpDto: any = {
            nombres: 'Juan',
            apellidos: 'Perez',
            vocativo: Vocative.SR,
            cargo: 'Manager',
            correo: 'juan@test.com',
            telefono: '999888777',
            correo2: 'juan2@test.com',
            comentarios: 'comentario',
            idOrganizacion: 'org-1',
        };

        await controller.create(httpDto, mockUser);

        const dto = createContactUseCase.execute.mock.calls[0][0];
        expect(dto.apellidos).toBe('Perez');
        expect(dto.vocativo).toBe(Vocative.SR);
        expect(dto.cargo).toBe('Manager');
        expect(dto.telefono).toBe('999888777');
        expect(dto.correo2).toBe('juan2@test.com');
        expect(dto.comentarios).toBe('comentario');
    });

    it('create defaults every optional field to null when omitted', async () => {
        createContactUseCase.execute.mockResolvedValue(enrichedContact);

        const httpDto: any = {
            nombres: 'Juan',
            correo: 'juan@test.com',
            idOrganizacion: 'org-1',
        };

        await controller.create(httpDto, mockUser);

        const dto = createContactUseCase.execute.mock.calls[0][0];
        expect(dto.apellidos).toBeNull();
        expect(dto.vocativo).toBeNull();
        expect(dto.cargo).toBeNull();
        expect(dto.telefono).toBeNull();
        expect(dto.correo2).toBeNull();
        expect(dto.comentarios).toBeNull();
    });
});
