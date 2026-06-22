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
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadHasPendingActivitiesException } from '@/modules/leads/domain/exceptions/lead-has-pending-activities.exception';
import { CotizacionConflictException } from '@/modules/quotations/domain/exceptions/cotizacion-conflict.exception';
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
        const leadWithRelations =
            await this.leadRepository.findByIdWithRelations(dto.idLead);
        if (!leadWithRelations) {
            throw new LeadNotFoundException(
                `Lead con id ${dto.idLead} no encontrado`,
            );
        }
        const { lead, organizationName, contactName } = leadWithRelations;

        const remitente = await this.userRepository.findById(dto.idRemitente);
        if (!remitente) {
            throw new UserNotFoundException(
                `Remitente con id ${dto.idRemitente} no encontrado`,
            );
        }

        // Un lead solo puede tener una cotización. Si ya existe una vinculada
        // (sea el borrador auto-generado al pasar a OFERTADO o una previa) no se
        // crea otra.
        const existing = await this.cotizacionRepository.count({
            idLead: dto.idLead,
        });
        if (existing > 0) {
            throw new CotizacionConflictException(
                `El lead ${dto.idLead} ya tiene una cotización`,
            );
        }

        // Crear una cotización para un lead en prospección lo promueve a
        // OFERTADO. Antes de transicionar, el lead no debe tener actividades
        // pendientes: deben resolverse (completarse o cancelarse) primero. Si ya
        // está en OFERTADO (u otro estado posterior) solo se registra la
        // cotización sin tocar el estado.
        const shouldPromote = lead.estado === LeadState.EN_PROSPECTO;
        if (shouldPromote) {
            const hasPending = await this.leadRepository.hasPendingActivities(
                dto.idLead,
            );
            if (hasPending) {
                throw new LeadHasPendingActivitiesException(
                    `No se puede crear la cotización porque el lead ${dto.idLead} tiene actividades pendientes`,
                );
            }
        }

        // "cliente" y "dirigido" se derivan del lead: el cliente es la
        // organización del lead y el dirigido es su contacto asociado (null si
        // el lead no tiene contacto). No se piden en el endpoint de creación.
        const cliente = organizationName || null;
        const dirigido = contactName;

        const cotizacion = new Cotizacion(
            null,
            dto.fechaCot,
            dirigido,
            cliente,
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

        // Al promover, la creación de la cotización y el cambio de estado del
        // lead se persisten de forma atómica para evitar dejar el lead en
        // OFERTADO sin cotización si algo falla a mitad de camino.
        if (shouldPromote) {
            return await this.cotizacionRepository.createAndPromoteLead(
                cotizacion,
                lead.id!,
                LeadState.OFERTADO,
            );
        }

        return await this.cotizacionRepository.saveWithRelations(cotizacion);
    }
}
