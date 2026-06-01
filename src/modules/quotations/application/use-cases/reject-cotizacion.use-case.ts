import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    COTIZACION_REPOSITORY,
    type CotizacionRepositoryPort,
} from '@/modules/quotations/domain/ports/cotizacion-repository.port';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';

export class RejectCotizacionUseCase {
    constructor(
        @Inject(COTIZACION_REPOSITORY)
        private readonly cotizacionRepository: CotizacionRepositoryPort,
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
    ) {}

    async execute(id: number) {
        const cotizacion = await this.cotizacionRepository.findById(id);
        if (!cotizacion) {
            throw new CotizacionNotFoundException(
                `Cotización con id ${id} no encontrada`,
            );
        }

        cotizacion.reject();

        const lead = await this.leadRepository.findById(cotizacion.id_lead);
        if (!lead) {
            throw new LeadNotFoundException(
                `Lead con id ${cotizacion.id_lead} no encontrado`,
            );
        }

        lead.changeState(LeadState.CIERRE_SIN_VENTA);

        return await this.cotizacionRepository.rejectAndUpdateLead(
            cotizacion.id!,
            lead.id!,
            LeadState.CIERRE_SIN_VENTA,
        );
    }
}
