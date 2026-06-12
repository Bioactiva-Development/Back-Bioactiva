import { Lead } from '@/modules/leads/domain/entities/lead';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';
import { ActivityAlertFilter } from '@/modules/leads/domain/enums/activity-alert-filter';

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
     * Filtra por el semáforo de actividades del lead. Si se omite, no filtra:
     * - TODAS: alerta amarilla o roja (por vencer o vencidas).
     * - POR_VENCER: solo amarilla (próximas a vencer, sin vencidas).
     * - VENCIDAS: solo roja (al menos una pendiente ya vencida).
     */
    alertaActividad?: ActivityAlertFilter;
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
    /** True si el lead tiene al menos una actividad PENDIENTE no eliminada. */
    hasPendingActivities(leadId: number): Promise<boolean>;
}

export const LEAD_REPOSITORY = Symbol('LEAD_REPOSITORY');
