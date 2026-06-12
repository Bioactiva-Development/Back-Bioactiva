import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ChangeContactStatusUseCase } from '@/modules/contacts/application/use-cases/change-contact-status.use-case';
import { Contact } from '@/modules/contacts/domain/entities/contact';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';

describe('Contacts module', () => {
    describe('ChangeContactStatusUseCase', () => {
        let useCase: ChangeContactStatusUseCase;
        let contactRepository: any;

        const buildContact = (estado: EstadoCorreo) =>
            new Contact(
                1,
                'John',
                'Doe',
                Vocative.SR,
                'Developer',
                'john@example.com',
                '987654321',
                null,
                'Test contact',
                'org-123',
                1,
                new Date(),
                new Date(),
                estado,
            );

        beforeEach(() => {
            contactRepository = {
                findById: jest.fn(),
                save: jest.fn(),
                findByIdWithOrganization: jest.fn(),
            };

            useCase = new ChangeContactStatusUseCase(contactRepository);
        });

        it('should mark a VIGENTE contact as VENCIDO', async () => {
            const contact = buildContact(EstadoCorreo.VIGENTE);
            contactRepository.findById.mockResolvedValue(contact);
            contactRepository.save.mockResolvedValue(contact);
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                contact,
                organizationName: 'Org A',
            });

            const result = await useCase.execute(1, EstadoCorreo.VENCIDO);

            expect(contact.estado_correo).toBe(EstadoCorreo.VENCIDO);
            expect(contactRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    estado_correo: EstadoCorreo.VENCIDO,
                }),
            );
            expect(result.contact.estado_correo).toBe(EstadoCorreo.VENCIDO);
        });

        it('should reactivate a VENCIDO contact back to VIGENTE', async () => {
            const contact = buildContact(EstadoCorreo.VENCIDO);
            contactRepository.findById.mockResolvedValue(contact);
            contactRepository.save.mockResolvedValue(contact);
            contactRepository.findByIdWithOrganization.mockResolvedValue({
                contact,
                organizationName: 'Org A',
            });

            await useCase.execute(1, EstadoCorreo.VIGENTE);

            expect(contact.estado_correo).toBe(EstadoCorreo.VIGENTE);
            expect(contactRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    estado_correo: EstadoCorreo.VIGENTE,
                }),
            );
        });

        it('should throw ContactNotFoundException when the contact does not exist', async () => {
            contactRepository.findById.mockResolvedValue(null);

            await expect(
                useCase.execute(999, EstadoCorreo.VENCIDO),
            ).rejects.toThrow(ContactNotFoundException);
            expect(contactRepository.save).not.toHaveBeenCalled();
        });
    });
});
