import { describe, expect, it, beforeEach } from '@jest/globals';
import { UpdateContactUseCase } from '@/modules/contacts/application/use-cases/update-contact.use-case';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';

// Cubre las ramas toNull() de apellidos y comentarios (líneas 32 y 38):
// cadenas vacías/sólo-espacios deben quedar en null al persistir.
describe('Contacts module', () => {
    describe('UpdateContactUseCase toNull branches', () => {
        let useCase: UpdateContactUseCase;
        let contactRepository: any;

        const buildContact = () =>
            new Contact(
                1,
                'John',
                'Doe',
                Vocative.SR,
                'Developer',
                'john@example.com',
                '987654321',
                'john.secondary@example.com',
                'Test contact',
                'org-123',
                1,
                new Date(),
                new Date(),
            );

        beforeEach(() => {
            contactRepository = {
                findById: jest.fn(),
                findByEmail: jest.fn(),
                findBySecondaryEmail: jest.fn(),
                save: jest.fn(),
                findByIdWithOrganization: jest.fn(),
                findByOrganizationId: jest.fn(),
                findAll: jest.fn(),
                reassignOrganization: jest.fn(),
            };
            useCase = new UpdateContactUseCase(contactRepository);
        });

        it('should nullify blank apellidos and comentarios', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());
            contactRepository.save.mockImplementation(async (c: any) => c);
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                contact: buildContact(),
                organizationName: 'Org',
            });

            await useCase.execute(1, {
                apellidos: '   ',
                comentarios: '',
            } as any);

            expect(contactRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    apellidos: null,
                    comentarios: null,
                }),
            );
        });

        it('should keep non-blank apellidos and comentarios', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());
            contactRepository.save.mockImplementation(async (c: any) => c);
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                contact: buildContact(),
                organizationName: 'Org',
            });

            await useCase.execute(1, {
                apellidos: 'Smith',
                comentarios: 'A note',
            } as any);

            expect(contactRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    apellidos: 'Smith',
                    comentarios: 'A note',
                }),
            );
        });
    });
});
