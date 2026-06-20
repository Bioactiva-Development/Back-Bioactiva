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
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadHasPendingActivitiesException } from '@/modules/leads/domain/exceptions/lead-has-pending-activities.exception';
import { InvalidLeadTransitionException } from '@/modules/leads/domain/exceptions/invalid-lead-transition.exception';

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

        const isStateChange = dto.estado !== lead.estado;

        // Valida la transición antes que cualquier otra regla (sin mutar el
        // lead): una transición inválida (p. ej. volver a EN_PROSPECTO) debe
        // fallar con su propio error, no con el de actividades pendientes.
        if (!lead.canTransitionTo(dto.estado)) {
            throw new InvalidLeadTransitionException(
                `No se puede cambiar el estado del lead de ${lead.estado} a ${dto.estado}`,
            );
        }

        // Un cambio real de estado exige que el lead no tenga actividades
        // pendientes: deben resolverse (completarse o cancelarse) primero.
        if (isStateChange) {
            const hasPending = await this.leadRepository.hasPendingActivities(
                id,
            );
            if (hasPending) {
                throw new LeadHasPendingActivitiesException(
                    `No se puede cambiar el estado del lead ${id} porque tiene actividades pendientes`,
                );
            }
        }

        lead.changeState(dto.estado);

        const saved = await this.leadRepository.saveWithRelations(lead);

        // Ante un cambio real de estado se notifica al contexto de cotizaciones
        // para mantener la cotización vinculada en sincronía con el lead: al
        // ofertar genera el borrador y en los cierres/reapertura refleja el
        // estado correspondiente (best-effort, no rompe el cambio del lead).
        if (isStateChange) {
            await this.offeredLeadHandler.handle(lead);
        }

        return saved;
    }
}
