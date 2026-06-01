import {
    Cotizacion as PrismaCotizacion,
    EstadoCot as PrismaEstadoCot,
    TipoMoneda as PrismaTipoMoneda,
    Prisma,
} from '@prisma/client';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

export class CotizacionMapper {
    static mapState(state: PrismaEstadoCot): EstadoCot {
        switch (state) {
            case 'PENDIENTE':
                return EstadoCot.PENDIENTE;
            case 'ENVIADA':
                return EstadoCot.ENVIADA;
            case 'ACEPTADA':
                return EstadoCot.ACEPTADA;
            case 'RECHAZADA':
                return EstadoCot.RECHAZADA;
        }
    }

    static mapStateToPrisma(state: EstadoCot): PrismaEstadoCot {
        switch (state) {
            case EstadoCot.PENDIENTE:
                return 'PENDIENTE';
            case EstadoCot.ENVIADA:
                return 'ENVIADA';
            case EstadoCot.ACEPTADA:
                return 'ACEPTADA';
            case EstadoCot.RECHAZADA:
                return 'RECHAZADA';
        }
    }

    static mapType(type: PrismaTipoMoneda): TipoMoneda {
        switch (type) {
            case 'PEN':
                return TipoMoneda.PEN;
            case 'USD':
                return TipoMoneda.USD;
        }
    }

    static mapTypeToPrisma(type: TipoMoneda): PrismaTipoMoneda {
        switch (type) {
            case TipoMoneda.PEN:
                return 'PEN';
            case TipoMoneda.USD:
                return 'USD';
        }
    }

    static toDomain(record: PrismaCotizacion): Cotizacion {
        return new Cotizacion(
            record.id,
            record.fechaCot,
            record.dirigido,
            record.cliente,
            record.producto,
            record.nombreRemitente,
            record.nombreServicio,
            record.monto.toString(),
            this.mapType(record.tipo),
            this.mapState(record.estado),
            record.observacion,
            record.linkPropuesta,
            record.idLead,
            record.idRemitente,
            record.createdAt,
            record.updatedAt,
            record.deletedAt,
        );
    }

    static toPersistence(cotizacion: Cotizacion): Prisma.CotizacionCreateInput {
        return {
            lead: { connect: { id: cotizacion.id_lead } },
            remitente: { connect: { id: cotizacion.id_remitente } },
            fechaCot: cotizacion.fecha_cot,
            dirigido: cotizacion.dirigido,
            cliente: cotizacion.cliente,
            producto: cotizacion.producto,
            nombreRemitente: cotizacion.nombre_remitente,
            nombreServicio: cotizacion.nombre_servicio,
            monto: cotizacion.monto,
            tipo: this.mapTypeToPrisma(cotizacion.tipo),
            estado: this.mapStateToPrisma(cotizacion.estado),
            observacion: cotizacion.observacion,
            linkPropuesta: cotizacion.link_propuesta,
            deletedAt: cotizacion.deleted_at,
        };
    }
}
