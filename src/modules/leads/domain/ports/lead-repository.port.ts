import { Lead } from '@/modules/leads/domain/entities/lead';
import { ActivityAlertLevel } from '@/modules/leads/domain/enums/activity-alert-level';

export interface LeadWithRelations {
    lead: Lead;
    organizationName: string;
    encargadoNombre: string;
    encargadoApellidos: string;
    contactName: string | null;
    /** Semáforo de actividades del lead (libre / pendiente / crítico / por vencer). */
    activityAlert: ActivityAlertLevel;
}

export interface ListLeadsParams {
    estado?: string;
    idOrg?: string;
    idEncargado?: number;
    /** Búsqueda textual sobre el servicio de interés del lead. */
    search?: string;
    /** Sector de la organización del lead (valor del enum Sector). */
    sector?: string;
    /** Tipo de organización del lead (valor del enum EnterpriseType). */
    tipo?: string;
    /** Rango sobre la fecha de creación del lead (createdAt). */
    fechaDesde?: Date;
    fechaHasta?: Date;
    /**
     * Filtra por el nivel del semáforo de actividades del lead. Si se omite, no
     * filtra. Valores: SIN_ACTIVIDADES, PENDIENTE, POR_VENCER.
     */
    alertaActividad?: ActivityAlertLevel;
    /** Si es true, solo leads con al menos una actividad PENDIENTE no eliminada. */
    conActividadesPendientes?: boolean;
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
