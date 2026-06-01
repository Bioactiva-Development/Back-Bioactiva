import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    COTIZACION_REPOSITORY,
    type CotizacionRepositoryPort,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { CreateCotizacionDto } from '@/modules/quotations/application/dto/create-cotizacion.dto';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';

export class CreateCotizacionUseCase {
    constructor(
        @Inject(COTIZACION_REPOSITORY)
        private readonly cotizacionRepository: CotizacionRepositoryPort,
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(dto: CreateCotizacionDto) {
        const lead = await this.leadRepository.findById(dto.idLead);
        if (!lead) {
            throw new LeadNotFoundException(
                `Lead con id ${dto.idLead} no encontrado`,
            );
        }

        const remitente = await this.userRepository.findById(dto.idRemitente);
        if (!remitente) {
            throw new UserNotFoundException(
                `Remitente con id ${dto.idRemitente} no encontrado`,
            );
        }

        const cotizacion = new Cotizacion(
            null,
            dto.fechaCot,
            dto.dirigido,
            dto.cliente,
            dto.producto,
            `${remitente.nombres} ${remitente.apellidos}`,
            dto.nombreServicio,
            dto.monto,
            dto.tipo as TipoMoneda,
            EstadoCot.PENDIENTE,
            dto.observacion,
            dto.linkPropuesta,
            dto.idLead,
            dto.idRemitente,
            dto.idAuthor,
            new Date(),
            new Date(),
            null,
        );

        return await this.cotizacionRepository.saveWithRelations(cotizacion);
    }
}
