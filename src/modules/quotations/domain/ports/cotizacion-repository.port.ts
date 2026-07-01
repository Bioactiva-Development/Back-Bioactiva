import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

export interface CotizacionWithRelations {
    cotizacion: Cotizacion;
    leadServicioInteres: string;
    leadEstado: string;
    contactName: string;
    remitenteNombre: string;
    remitenteApellidos: string;
}

export interface ListCotizacionesParams {
    idLead?: number;
    /** Filtra por la organización del lead asociado (Lead.idOrg). */
    idOrg?: string;
    estado?: string;
    idRemitente?: number;
    /** Filtra por moneda (PEN / USD). */
    tipo?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    page?: number;
    limit?: number;
}

export interface KpisCotizacionesParams {
    fechaDesde?: Date;
    fechaHasta?: Date;
}

export interface CotizacionKpis {
    /** Suma de montos de cotizaciones no rechazadas. */
    totalActivo: number;
    aceptadas: number;
    enviadas: number;
    rechazadas: number;
}

export interface CotizacionRepositoryPort {
    findById(id: number): Promise<Cotizacion | null>;
    findByIdWithRelations(id: number): Promise<CotizacionWithRelations | null>;
    /** Cotización (única) vinculada a un lead, o null si no tiene. */
    findByLead(leadId: number): Promise<Cotizacion | null>;
    save(cotizacion: Cotizacion): Promise<Cotizacion>;
    saveWithRelations(cotizacion: Cotizacion): Promise<CotizacionWithRelations>;
    /**
     * Crea la cotización y promueve el estado del lead asociado de forma
     * atómica (una sola transacción): o se persisten ambos cambios o ninguno.
     */
    createAndPromoteLead(
        cotizacion: Cotizacion,
        leadId: number,
        leadState: LeadState,
    ): Promise<CotizacionWithRelations>;
    acceptAndUpdateLead(
        cotizacionId: number,
        leadId: number,
        leadState: LeadState,
        expectedEstado: EstadoCot,
    ): Promise<CotizacionWithRelations>;
    rejectAndUpdateLead(
        cotizacionId: number,
        leadId: number,
        leadState: LeadState,
        expectedEstado: EstadoCot,
    ): Promise<CotizacionWithRelations>;
    list(params?: ListCotizacionesParams): Promise<CotizacionWithRelations[]>;
    count(
        params?: Omit<ListCotizacionesParams, 'page' | 'limit'>,
    ): Promise<number>;
    getKpis(params?: KpisCotizacionesParams): Promise<CotizacionKpis>;
}

export const COTIZACION_REPOSITORY = Symbol('COTIZACION_REPOSITORY');
