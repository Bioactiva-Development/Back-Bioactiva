import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

export class Cotizacion {
    constructor(
        public readonly id: number,
        public fecha_cot: Date,
        public dirigido: string,
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
        public readonly created_at: Date,
        public updated_at: Date,
    ) {}

    accept() {
        this.estado = EstadoCot.ACEPTADA;
        this.updated_at = new Date();
    }

    reject() {
        this.estado = EstadoCot.RECHAZADA;
        this.updated_at = new Date();
    }

    markPending() {
        this.estado = EstadoCot.PENDIENTE;
        this.updated_at = new Date();
    }
}
