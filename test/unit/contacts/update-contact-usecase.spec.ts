import { describe, expect, it, beforeEach } from '@jest/globals';
import { UpdateContactUseCase } from '@/modules/contacts/application/use-cases/update-contact.use-case';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';

describe('Contacts module', () => {
    describe('UpdateContactUseCase', () => {
        let useCase: UpdateContactUseCase;
        let contactRepository: any;

        const mockContact = new Contact(
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

        it('should update contact with valid data', async () => {
            contactRepository.findById.mockResolvedValue(mockContact);
            contactRepository.findByEmail.mockResolvedValue(null);
            contactRepository.save.mockResolvedValue({
                ...mockContact,
                nombres: 'Jane',
            });
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                ...mockContact,
                nombres: 'Jane',
            });

            const result = await useCase.execute(1, {
                nombres: 'Jane',
            });

            expect(result.nombres).toBe('Jane');
            expect(contactRepository.findById).toHaveBeenCalledWith(1);
            expect(contactRepository.save).toHaveBeenCalled();
        });

        it('should return contact not found error', async () => {
            contactRepository.findById.mockResolvedValue(null);

            await expect(
                useCase.execute(999, { nombres: 'Jane' }),
            ).rejects.toThrow();
        });

        it('should prevent duplicate email on update', async () => {
            const existingContact = new Contact(
                2,
                'Jane',
                'Smith',
                Vocative.SRA,
                'Designer',
                'jane@example.com',
                '987654321',
                null,
                'Another contact',
                'org-123',
                1,
                new Date(),
                new Date(),
            );

            contactRepository.findById.mockResolvedValue(mockContact);
            contactRepository.findByEmail.mockResolvedValue(existingContact);
            contactRepository.findByIdWithOrganization.mockResolvedValue(
                existingContact,
            );

            await expect(
                useCase.execute(1, { correo: 'jane@example.com' }),
            ).rejects.toThrow();
        });

        it('should persist contact updates correctly', async () => {
            const updatedData = {
                nombres: 'Updated Name',
                telefono: '555555555',
            };

            contactRepository.findById.mockResolvedValue(mockContact);
            contactRepository.findByEmail.mockResolvedValue(null);
            const savedContact = { ...mockContact, ...updatedData };
            contactRepository.save.mockResolvedValue(savedContact);
            contactRepository.findByIdWithOrganization.mockResolvedValue(
                savedContact,
            );

            const result = await useCase.execute(1, updatedData);

            expect(result.nombres).toBe('Updated Name');
            expect(result.telefono).toBe('555555555');
            expect(contactRepository.save).toHaveBeenCalledWith(
                expect.objectContaining(updatedData),
            );
        });

        it('should allow partial updates', async () => {
            contactRepository.findById.mockResolvedValue(mockContact);
            contactRepository.findByEmail.mockResolvedValue(null);
            contactRepository.save.mockResolvedValue({
                ...mockContact,
                telefono: '999999999',
            });
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                ...mockContact,
                telefono: '999999999',
            });

            const result = await useCase.execute(1, {
                telefono: '999999999',
            });

            expect(result.telefono).toBe('999999999');
            expect(result.nombres).toBe(mockContact.nombres);
        });

        it('should validate contact vocativo if provided', async () => {
            contactRepository.findById.mockResolvedValue(mockContact);
            contactRepository.findByEmail.mockResolvedValue(null);
            contactRepository.save.mockResolvedValue({
                ...mockContact,
                vocativo: Vocative.SRA,
            });
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                ...mockContact,
                vocativo: Vocative.SRA,
            });

            const result = await useCase.execute(1, {
                vocativo: Vocative.SRA,
            });

            expect(result.vocativo).toBe(Vocative.SRA);
        });

        it('should update contact email when new email is unique', async () => {
            contactRepository.findById.mockResolvedValue(mockContact);
            contactRepository.findByEmail.mockResolvedValue(null);
            const savedContact = {
                ...mockContact,
                correo: 'newemail@example.com',
            };
            contactRepository.save.mockResolvedValue(savedContact);
            contactRepository.findByIdWithOrganization.mockResolvedValue(
                savedContact,
            );

            const result = await useCase.execute(1, {
                correo: 'newemail@example.com',
            });

            expect(result.correo).toBe('newemail@example.com');
            expect(contactRepository.findByEmail).toHaveBeenCalledWith(
                'newemail@example.com',
            );
        });

        it('should update contact secondary email when new secondary email is unique', async () => {
            contactRepository.findById.mockResolvedValue(mockContact);
            contactRepository.findByEmail.mockResolvedValue(null);
            contactRepository.findBySecondaryEmail.mockResolvedValue(null);
            const savedContact = {
                ...mockContact,
                correo2: 'new.secondary@example.com',
            };
            contactRepository.save.mockResolvedValue(savedContact);
            contactRepository.findByIdWithOrganization.mockResolvedValue(
                savedContact,
            );

            const result = await useCase.execute(1, {
                correo2: 'new.secondary@example.com',
            });

            expect(result.correo2).toBe('new.secondary@example.com');
            expect(contactRepository.findBySecondaryEmail).toHaveBeenCalledWith(
                'new.secondary@example.com',
            );
        });

        // El use-case muta la entidad in-place, así que cada test de mudanza
        // construye su propio contacto para no contaminar al compartido.
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

        it('should move the contact to another organization', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());
            contactRepository.reassignOrganization.mockResolvedValue(undefined);
            contactRepository.save.mockImplementation(async (c: any) => c);
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                contact: buildContact(),
                organizationName: 'Nueva Org',
            });

            await useCase.execute(1, { idOrganizacion: 'org-999' } as any);

            // Valida la org destino y libera la org anterior antes de persistir.
            expect(
                contactRepository.reassignOrganization,
            ).toHaveBeenCalledWith(1, 'org-123', 'org-999');
            expect(contactRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ idOrganizacion: 'org-999' }),
            );
        });

        it('should not reassign when the organization does not change', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());
            contactRepository.save.mockImplementation(async (c: any) => c);
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                contact: buildContact(),
                organizationName: 'Org',
            });

            await useCase.execute(1, { idOrganizacion: 'org-123' } as any);

            expect(
                contactRepository.reassignOrganization,
            ).not.toHaveBeenCalled();
        });

        it('should propagate the error when the target organization is invalid', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());
            contactRepository.reassignOrganization.mockRejectedValue(
                new Error(
                    'Organización con id org-x no encontrada o desactivada',
                ),
            );

            await expect(
                useCase.execute(1, { idOrganizacion: 'org-x' } as any),
            ).rejects.toThrow('no encontrada o desactivada');
            expect(contactRepository.save).not.toHaveBeenCalled();
        });

        it('should reject duplicate secondary email', async () => {
            const existingContact = new Contact(
                3,
                'Other',
                'User',
                Vocative.SR,
                'Test',
                'other@example.com',
                null,
                'existing.secondary@example.com',
                null,
                'org-456',
                2,
                new Date('2024-01-01'),
                new Date('2024-01-01'),
            );

            contactRepository.findById.mockResolvedValue(mockContact);
            contactRepository.findBySecondaryEmail.mockResolvedValue(
                existingContact,
            );

            await expect(
                useCase.execute(1, {
                    correo2: 'existing.secondary@example.com',
                }),
            ).rejects.toThrow();
        });
    });
});
