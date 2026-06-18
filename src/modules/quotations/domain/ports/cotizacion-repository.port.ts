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

export interface CotizacionRepositoryPort {
    findById(id: number): Promise<Cotizacion | null>;
    findByIdWithRelations(id: number): Promise<CotizacionWithRelations | null>;
    save(cotizacion: Cotizacion): Promise<Cotizacion>;
    saveWithRelations(cotizacion: Cotizacion): Promise<CotizacionWithRelations>;
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
}

export const COTIZACION_REPOSITORY = Symbol('COTIZACION_REPOSITORY');
