import { Lead } from '@/modules/leads/domain/entities/lead';

export interface LeadRepository {
    findById(id: number): Promise<Lead | null>;
    save(lead: Lead): Promise<Lead>;
    delete(id: number): Promise<void>;
    findAllByOrganization(idOrg: string): Promise<Lead[]>;
}
