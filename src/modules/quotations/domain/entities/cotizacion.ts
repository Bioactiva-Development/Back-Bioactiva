import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { InvalidCotizacionTransitionException } from '@/modules/quotations/domain/exceptions/invalid-cotizacion-transition.exception';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

/**
 * Mapeo 1:1 entre el estado del lead y el de su cotización. Solo cubre los
 * estados del lead que tienen un reflejo en la cotización; EN_PROSPECTO no
 * aparece porque en esa fase el lead aún no tiene cotización.
 */
const COTIZACION_ESTADO_POR_LEAD: Partial<Record<LeadState, EstadoCot>> = {
    [LeadState.OFERTADO]: EstadoCot.PENDIENTE,
    [LeadState.CIERRE_CON_VENTA]: EstadoCot.ACEPTADA,
    [LeadState.CIERRE_SIN_VENTA]: EstadoCot.RECHAZADA,
};

export class Cotizacion {
    constructor(
        public readonly id: number | null,
        public fecha_cot: Date,
        public dirigido: string | null,
        public cliente: string | null,
        public producto: string | null,
        public nombre_remitente: string,
        public nombre_servicio: string,
        public monto: string,
        public tipo: TipoMoneda,
        public estado: EstadoCot,
        public observacion: string | null,
        public link_propuesta: string | null,
        public id_lead: number,
        public id_remitente: number,
        public readonly id_author: number,
        public readonly created_at: Date,
        public updated_at: Date,
        public deleted_at: Date | null,
    ) {}

    send() {
        if (this.estado !== EstadoCot.PENDIENTE) {
            throw new InvalidCotizacionTransitionException(
                'Solo se puede enviar una cotización en estado PENDIENTE',
            );
        }
        this.estado = EstadoCot.ENVIADA;
        this.updated_at = new Date();
    }

    accept() {
        if (
            this.estado !== EstadoCot.PENDIENTE &&
            this.estado !== EstadoCot.ENVIADA
        ) {
            throw new InvalidCotizacionTransitionException(
                'Solo se puede aceptar una cotización en estado PENDIENTE o ENVIADA',
            );
        }
        this.estado = EstadoCot.ACEPTADA;
        this.updated_at = new Date();
    }

    reject() {
        if (
            this.estado !== EstadoCot.PENDIENTE &&
            this.estado !== EstadoCot.ENVIADA
        ) {
            throw new InvalidCotizacionTransitionException(
                'Solo se puede rechazar una cotización en estado PENDIENTE o ENVIADA',
            );
        }
        this.estado = EstadoCot.RECHAZADA;
        this.updated_at = new Date();
    }

    /**
     * Sincroniza el estado de la cotización con el del lead vinculado cuando el
     * cambio se origina en el lead (PATCH /leads/{id}/status), que es la fuente
     * de verdad en esa dirección. A diferencia de send()/accept()/reject(), no
     * aplica los guards de transición: el lead ya validó su propia transición y
     * aquí solo se refleja el mapeo 1:1 (incluida la reapertura a PENDIENTE al
     * volver el lead a OFERTADO). Devuelve true si hubo un cambio efectivo.
     */
    syncWithLeadState(leadState: LeadState): boolean {
        const mapped = COTIZACION_ESTADO_POR_LEAD[leadState];
        if (mapped === undefined || mapped === this.estado) {
            return false;
        }
        this.estado = mapped;
        this.updated_at = new Date();
        return true;
    }

    markAsDeleted() {
        this.deleted_at = new Date();
        this.updated_at = new Date();
    }
}
