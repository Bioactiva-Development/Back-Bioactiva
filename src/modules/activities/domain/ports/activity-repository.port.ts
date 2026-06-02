import { Actividad } from '@/modules/activities/domain/entities/actividad';

export interface ActivityWithRelations {
    activity: Actividad;
    leadServicioInteres: string;
    leadEstado: string;
    responsableNombre: string;
    responsableApellidos: string;
}

export interface ListActivitiesParams {
    idLead?: number;
    idResponsable?: number;
    estado?: string;
    tipo?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    page?: number;
    limit?: number;
}

export interface ActivityRepository {
    findById(id: number): Promise<Actividad | null>;
    findByIdWithRelations(id: number): Promise<ActivityWithRelations | null>;
    findPendingByLead(idLead: number): Promise<Actividad | null>;
    save(activity: Actividad): Promise<Actividad>;
    saveWithRelations(activity: Actividad): Promise<ActivityWithRelations>;
    list(params?: ListActivitiesParams): Promise<ActivityWithRelations[]>;
    count(
        params?: Omit<ListActivitiesParams, 'page' | 'limit'>,
    ): Promise<number>;
}

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');
