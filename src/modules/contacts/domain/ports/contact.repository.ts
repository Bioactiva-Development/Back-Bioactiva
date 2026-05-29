import { Contact } from '@/modules/contacts/domain/entities/contact';

export type ContactWithOrgName = {
    contact: Contact;
    organizationName: string;
};

export interface IContactRepository {
    save(contact: Contact): Promise<Contact>;

    findById(id: number): Promise<Contact | null>;

    findByEmail(email: string): Promise<Contact | null>;

    findBySecondaryEmail(email: string): Promise<Contact | null>;

    findByOrganizationId(idOrganizacion: string): Promise<Contact[]>;

    findAll(): Promise<Contact[]>;

    findAllWithOrganization(): Promise<ContactWithOrgName[]>;

    findByIdWithOrganization(id: number): Promise<ContactWithOrgName | null>;

    findByOrganizationIdWithOrganization(idOrganizacion: string): Promise<ContactWithOrgName[]>;
}
export const IContactRepository = Symbol('IContactRepository');
