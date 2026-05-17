import { LeadState } from '@/modules/leads/domain/enums/lead-state';

export class Lead {
    constructor(
        public readonly id: number,
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
    ) {}

    changeState(estado: LeadState) {
        this.estado = estado;
        this.updated_at = new Date();
    }

    assignResponsible(idEncargado: number) {
        if (this.id_encargado === idEncargado) {
            throw new Error('El encargado ya está asignado');
        }
        this.id_encargado = idEncargado;
        this.updated_at = new Date();
    }

    attachContact(idContacto: number | null) {
        this.id_contacto = idContacto;
        this.updated_at = new Date();
    }
}
