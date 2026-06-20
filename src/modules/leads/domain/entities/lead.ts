import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { InvalidLeadResponsibleException } from '@/modules/leads/domain/exceptions/invalid-lead-responsible.exception';
import { InvalidLeadTransitionException } from '@/modules/leads/domain/exceptions/invalid-lead-transition.exception';

/**
 * Transiciones válidas del ciclo de vida de un Lead. EN_PROSPECTO es la fase
 * inicial: solo puede avanzar a OFERTADO y, una vez que el lead sale de ella,
 * ya no puede volver. Los tres estados posteriores (OFERTADO, CIERRE_CON_VENTA
 * y CIERRE_SIN_VENTA) son intercambiables entre sí. Permanecer en el mismo
 * estado siempre es válido (no-op).
 */
const ALLOWED_TRANSITIONS: Record<LeadState, LeadState[]> = {
    [LeadState.EN_PROSPECTO]: [LeadState.OFERTADO],
    [LeadState.OFERTADO]: [
        LeadState.CIERRE_CON_VENTA,
        LeadState.CIERRE_SIN_VENTA,
    ],
    [LeadState.CIERRE_CON_VENTA]: [
        LeadState.OFERTADO,
        LeadState.CIERRE_SIN_VENTA,
    ],
    [LeadState.CIERRE_SIN_VENTA]: [
        LeadState.OFERTADO,
        LeadState.CIERRE_CON_VENTA,
    ],
};

export class Lead {
    constructor(
        public readonly id: number | null,
        public id_org: string,
        public id_contacto: number | null,
        public estado: LeadState,
        public servicio_interes: string,
        public comentarios: string | null,
        public desafio_oportunidad: string | null,
        public id_encargado: number,
        public canal_captacion: string | null,
        public id_author: number,
        public created_at: Date,
        public updated_at: Date,
        public deleted_at: Date | null,
        public ultimo_cambio: Date,
        public fecha_cierre: Date | null = null,
    ) {}

    /**
     * ¿La transición del estado actual a `estado` es válida? Permanecer en el
     * mismo estado se considera válido (no-op).
     */
    canTransitionTo(estado: LeadState): boolean {
        return (
            estado === this.estado ||
            ALLOWED_TRANSITIONS[this.estado].includes(estado)
        );
    }

    changeState(estado: LeadState) {
        if (!this.canTransitionTo(estado)) {
            throw new InvalidLeadTransitionException(
                `No se puede cambiar el estado del lead de ${this.estado} a ${estado}`,
            );
        }
        if (estado === LeadState.CIERRE_CON_VENTA) {
            // Se sella la fecha de cierre al concretar la venta.
            this.fecha_cierre = new Date();
        } else if (this.estado === LeadState.CIERRE_CON_VENTA) {
            // Si el lead sale de CIERRE_CON_VENTA, la fecha deja de ser válida.
            this.fecha_cierre = null;
        }
        this.estado = estado;
        this.updated_at = new Date();
        this.ultimo_cambio = new Date();
    }

    assignResponsible(idEncargado: number) {
        if (this.id_encargado === idEncargado) {
            throw new InvalidLeadResponsibleException(
                'El encargado ya está asignado',
            );
        }
        this.id_encargado = idEncargado;
        this.updated_at = new Date();
    }

    markAsDeleted() {
        this.deleted_at = new Date();
        this.updated_at = new Date();
    }
}
