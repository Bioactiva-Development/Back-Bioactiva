import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateContactUseCase } from '@/modules/contacts/application/use-cases/update-contact.use-case';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';

describe('Contacts module', () => {
    describe('UpdateContactUseCase — branches', () => {
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
                save: jest.fn(async (c: any) => c),
                findByIdWithOrganization: jest.fn(async () => ({
                    contact: buildContact(),
                    organizationName: 'Org',
                })),
                findByOrganizationId: jest.fn(),
                findAll: jest.fn(),
                reassignOrganization: jest.fn(),
            };
            useCase = new UpdateContactUseCase(contactRepository);
        });

        it('updates cargo with toNull when provided', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());

            await useCase.execute(1, { cargo: 'Manager' } as any);

            expect(contactRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ cargo: 'Manager' }),
            );
        });

        it('skips the primary email lookup when correo is unchanged', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());

            await useCase.execute(1, { correo: 'john@example.com' } as any);

            expect(contactRepository.findByEmail).not.toHaveBeenCalled();
        });

        it('skips the secondary email lookup when correo2 is unchanged', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());

            await useCase.execute(1, {
                correo2: 'john.secondary@example.com',
            } as any);

            expect(
                contactRepository.findBySecondaryEmail,
            ).not.toHaveBeenCalled();
        });

        it('looks up a changed primary email before persisting', async () => {
            contactRepository.findById.mockResolvedValue(buildContact());
            contactRepository.findByEmail.mockResolvedValue(null);

            await useCase.execute(1, { correo: 'new@example.com' } as any);

            expect(contactRepository.findByEmail).toHaveBeenCalledWith(
                'new@example.com',
            );
            expect(contactRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ correo: 'new@example.com' }),
            );
        });
    });
});
