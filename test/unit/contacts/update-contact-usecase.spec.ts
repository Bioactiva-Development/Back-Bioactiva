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
