import { Organization } from '@modules/organizations/domain/entities/organization';

export interface IOrganizationRepository {
    save(organization: Organization): Promise<Organization>;
    findById(id: string): Promise<Organization | null>;
    findByRuc(ruc: string): Promise<Organization | null>;
    findByCodigoCliente(codigoCliente: string): Promise<Organization | null>;
    findAll(): Promise<Organization[]>;
}
export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');
