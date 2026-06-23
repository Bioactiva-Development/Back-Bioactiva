import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    COTIZACION_REPOSITORY,
    type CotizacionRepositoryPort,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import { UpdateCotizacionDto } from '@/modules/quotations/application/dto/update-cotizacion.dto';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';
import { InvalidCotizacionTransitionException } from '@/modules/quotations/domain/exceptions/invalid-cotizacion-transition.exception';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

export class UpdateCotizacionUseCase {
    constructor(
        @Inject(COTIZACION_REPOSITORY)
        private readonly cotizacionRepository: CotizacionRepositoryPort,
    ) {}

    async execute(id: number, dto: UpdateCotizacionDto) {
        const cotizacion = await this.cotizacionRepository.findById(id);
        if (!cotizacion) {
            throw new CotizacionNotFoundException(
                'La cotización no fue encontrada',
            );
        }

        if (
            cotizacion.estado === EstadoCot.ACEPTADA ||
            cotizacion.estado === EstadoCot.RECHAZADA
        ) {
            throw new InvalidCotizacionTransitionException(
                'No se puede modificar una cotización ACEPTADA o RECHAZADA',
            );
        }

        if (dto.fechaCot !== undefined) cotizacion.fecha_cot = dto.fechaCot;
        if (dto.dirigido !== undefined) cotizacion.dirigido = dto.dirigido;
        if (dto.cliente !== undefined) cotizacion.cliente = dto.cliente;
        if (dto.producto !== undefined) cotizacion.producto = dto.producto;
        if (dto.nombreServicio !== undefined)
            cotizacion.nombre_servicio = dto.nombreServicio;
        if (dto.monto !== undefined) cotizacion.monto = dto.monto;
        if (dto.tipo !== undefined) cotizacion.tipo = dto.tipo as TipoMoneda;
        if (dto.observacion !== undefined)
            cotizacion.observacion = dto.observacion;
        if (dto.linkPropuesta !== undefined)
            cotizacion.link_propuesta = dto.linkPropuesta;

        cotizacion.updated_at = new Date();

        return await this.cotizacionRepository.saveWithRelations(cotizacion);
    }
}
