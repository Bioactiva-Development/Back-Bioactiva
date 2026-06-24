import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { UpdateLeadDto } from '@/modules/leads/application/dto/update-lead.dto';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';

export class UpdateLeadUseCase {
    constructor(
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
    ) {}

    async execute(id: number, dto: UpdateLeadDto) {
        const lead = await this.leadRepository.findById(id);
        if (!lead) {
            throw new LeadNotFoundException('El lead no fue encontrado');
        }

        // El encargado de un lead no se puede cambiar mediante actualización.

        if (dto.servicioInteres !== undefined) {
            lead.servicio_interes = dto.servicioInteres;
        }
        if (dto.comentarios !== undefined) {
            lead.comentarios = dto.comentarios;
        }
        if (dto.desafioOportunidad !== undefined) {
            lead.desafio_oportunidad = dto.desafioOportunidad;
        }
        if (dto.canalCaptacion !== undefined) {
            lead.canal_captacion = dto.canalCaptacion;
        }

        lead.updated_at = new Date();

        return await this.leadRepository.saveWithRelations(lead);
    }
}
