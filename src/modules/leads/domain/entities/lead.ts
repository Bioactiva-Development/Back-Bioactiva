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
        public id_author: string,
        public created_at: Date,
        public updated_at: Date,
    ) {}
}
