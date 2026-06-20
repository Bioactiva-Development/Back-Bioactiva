import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { InvalidCotizacionTransitionException } from '@/modules/quotations/domain/exceptions/invalid-cotizacion-transition.exception';

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

    markAsDeleted() {
        this.deleted_at = new Date();
        this.updated_at = new Date();
    }
}
