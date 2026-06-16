import { Organization } from '@modules/organizations/domain/entities/organization';

export interface ListOrganizationsParams {
    /** Sector de la organización (valor del enum Sector). */
    sector?: string;
    /** Tamaño de la organización (valor del enum Size). */
    tamano?: string;
    /** Tipo de organización (valor del enum EnterpriseType). */
    tipo?: string;
    page?: number;
    limit?: number;
}

export interface IOrganizationRepository {
    save(organization: Organization): Promise<Organization>;
    findById(id: string): Promise<Organization | null>;
    findByRuc(ruc: string): Promise<Organization | null>;
    findByCodigoCliente(codigoCliente: string): Promise<Organization | null>;
    findAll(params?: ListOrganizationsParams): Promise<Organization[]>;
    countAll(
        params?: Omit<ListOrganizationsParams, 'page' | 'limit'>,
    ): Promise<number>;
    /**
     * Desactiva (soft-delete) la organización y, en la misma transacción, marca
     * todos sus contactos con estado de correo VENCIDO. No elimina registros: se
     * preserva el `codigoCliente` para el monitoreo anual.
     */
    softDelete(id: string): Promise<void>;
}
export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');
