import { Organization } from '@modules/organizations/domain/entities/organization';

export interface IOrganizationRepository {
    save(organization: Organization): Promise<Organization>;
    findById(id: string): Promise<Organization | null>;
    findByRuc(ruc: string): Promise<Organization | null>;
    findByCodigoCliente(codigoCliente: string): Promise<Organization | null>;
    findAll(): Promise<Organization[]>;
    /**
     * Desactiva (soft-delete) la organización y, en la misma transacción, marca
     * todos sus contactos con estado de correo VENCIDO. No elimina registros: se
     * preserva el `codigoCliente` para el monitoreo anual.
     */
    softDelete(id: string): Promise<void>;
}
export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');
