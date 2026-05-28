import { Contact } from '@/modules/contacts/domain/entities/contact';

export interface IContactRepository {
    save(contact: Contact): Promise<Contact>;

    findById(id: number): Promise<Contact | null>;

    findByEmail(email: string): Promise<Contact | null>;

    findBySecondaryEmail(email: string): Promise<Contact | null>;

    findByOrganizationId(idOrganizacion: string): Promise<Contact[]>;

    findAll(): Promise<Contact[]>;
}
export const IContactRepository = Symbol('IContactRepository');
