import { Lead } from '@/modules/leads/domain/entities/lead';

export interface LeadWithRelations {
    lead: Lead;
    organizationName: string;
    encargadoNombre: string;
    encargadoApellidos: string;
    contactName: string | null;
}

export interface ListLeadsParams {
    estado?: string;
    idOrg?: string;
    idEncargado?: number;
    search?: string;
    page?: number;
    limit?: number;
}

export interface LeadRepository {
    findById(id: number): Promise<Lead | null>;
    findByIdWithRelations(id: number): Promise<LeadWithRelations | null>;
    save(lead: Lead): Promise<Lead>;
    saveWithRelations(lead: Lead): Promise<LeadWithRelations>;
    list(params?: ListLeadsParams): Promise<LeadWithRelations[]>;
    count(params?: Omit<ListLeadsParams, 'page' | 'limit'>): Promise<number>;
}

export const LEAD_REPOSITORY = Symbol('LEAD_REPOSITORY');
