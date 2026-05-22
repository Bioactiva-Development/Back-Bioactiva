import { Organization } from '../entities/organization';

export interface IOrganizationRepository {
    save(organization: Organization): Promise<Organization>;
    findById(id: string): Promise<Organization | null>;
    findByRuc(ruc: string): Promise<Organization | null>;
    findAll(): Promise<Organization[]>;
}
export const IOrganizationRepository = Symbol('IOrganizationRepository');
