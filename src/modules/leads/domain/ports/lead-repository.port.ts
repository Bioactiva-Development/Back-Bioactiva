import { Lead } from '@/modules/leads/domain/entities/lead';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

export interface LeadWithRelations {
    lead: Lead;
    organizationName: string;
    encargadoNombre: string;
    encargadoApellidos: string;
    contactName: string | null;
    /** Semáforo de actividades del lead (al día / por vencer / vencida). */
    activityAlert: ActivityAlertLevel;
}

export interface ListLeadsParams {
    estado?: string;
    idOrg?: string;
    idEncargado?: number;
    search?: string;
    /** Rango sobre la fecha de creación del lead (createdAt). */
    fechaDesde?: Date;
    fechaHasta?: Date;
    /**
     * Si es true, solo devuelve leads con alerta de actividades (amarillo o
     * rojo): con actividades pendientes próximas a vencer o ya vencidas.
     */
    conActividadesPorVencer?: boolean;
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
