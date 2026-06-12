import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import {
    OFFERED_LEAD_HANDLER,
    type OfferedLeadHandlerPort,
} from '@/modules/leads/domain/ports/offered-lead-handler.port';
import { ChangeLeadStatusDto } from '@/modules/leads/application/dto/change-lead-status.dto';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadHasPendingActivitiesException } from '@/modules/leads/domain/exceptions/lead-has-pending-activities.exception';

export class ChangeLeadStatusUseCase {
    constructor(
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
        @Inject(OFFERED_LEAD_HANDLER)
        private readonly offeredLeadHandler: OfferedLeadHandlerPort,
    ) {}

    async execute(id: number, dto: ChangeLeadStatusDto) {
        const lead = await this.leadRepository.findById(id);
        if (!lead) {
            throw new LeadNotFoundException(`Lead con id ${id} no encontrado`);
        }

        // Un cambio real de estado exige que el lead no tenga actividades
        // pendientes: deben resolverse (completarse o cancelarse) primero.
        if (dto.estado !== lead.estado) {
            const hasPending = await this.leadRepository.hasPendingActivities(
                id,
            );
            if (hasPending) {
                throw new LeadHasPendingActivitiesException(
                    `No se puede cambiar el estado del lead ${id} porque tiene actividades pendientes`,
                );
            }
        }

        const wasOffered = lead.estado === LeadState.OFERTADO;

        lead.changeState(dto.estado);

        const saved = await this.leadRepository.saveWithRelations(lead);

        // Solo en la transición real hacia OFERTADO (no si ya estaba ofertado) se
        // notifica al contexto de cotizaciones para que genere el borrador
        // vinculado al lead.
        if (dto.estado === LeadState.OFERTADO && !wasOffered) {
            await this.offeredLeadHandler.handle(lead);
        }

        return saved;
    }
}
