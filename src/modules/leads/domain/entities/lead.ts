import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { InvalidLeadResponsibleException } from '@/modules/leads/domain/exceptions/invalid-lead-responsible.exception';

export class Lead {
    constructor(
        public readonly id: number | null,
        public id_org: string,
        public id_contacto: number | null,
        public estado: LeadState,
        public servicio_interes: string,
        public comentarios: string | null,
        public desafio_oportunidad: string | null,
        public notas_contacto: string | null,
        public id_encargado: number,
        public canal_captacion: string | null,
        public id_author: number,
        public created_at: Date,
        public updated_at: Date,
        public deleted_at: Date | null,
        public ultimo_cambio: Date,
        public fecha_cierre: Date | null = null,
    ) {}

    changeState(estado: LeadState) {
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
