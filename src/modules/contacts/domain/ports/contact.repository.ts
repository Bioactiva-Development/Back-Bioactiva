import { Contact } from '@/modules/contacts/domain/entities/contact';

export type ContactWithOrgName = {
    contact: Contact;
    organizationName: string;
};

export interface ListContactsParams {
    /**
     * Filtro interno por organización. El endpoint de listado de contactos no
     * lo expone; lo usa el detalle de organización para paginar sus contactos.
     */
    idOrganization?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface IContactRepository {
    save(contact: Contact): Promise<Contact>;

    findById(id: number): Promise<Contact | null>;

    findByEmail(email: string): Promise<Contact | null>;

    findBySecondaryEmail(email: string): Promise<Contact | null>;

    findByOrganizationId(idOrganizacion: string): Promise<Contact[]>;

    findAll(): Promise<Contact[]>;

    findAllWithOrganization(): Promise<ContactWithOrgName[]>;

    list(params?: ListContactsParams): Promise<ContactWithOrgName[]>;

    count(params?: Omit<ListContactsParams, 'page' | 'limit'>): Promise<number>;

    findByIdWithOrganization(id: number): Promise<ContactWithOrgName | null>;

    findByOrganizationIdWithOrganization(
        idOrganizacion: string,
    ): Promise<ContactWithOrgName[]>;

    /**
     * Prepara la mudanza de un contacto a otra organización: valida que la
     * organización destino exista y esté vigente (no desactivada) y, si la
     * organización anterior tenía a este contacto como su contacto activo, limpia
     * esa referencia. No persiste el nuevo vínculo: el cambio de `idOrganizacion`
     * se guarda al hacer `save` de la entidad.
     */
    reassignOrganization(
        contactId: number,
        previousOrgId: string,
        newOrgId: string,
    ): Promise<void>;
}
export const IContactRepository = Symbol('IContactRepository');
