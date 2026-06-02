import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { UpdateLeadDto } from '@/modules/leads/application/dto/update-lead.dto';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { LeadContactInvalidException } from '@/modules/leads/domain/exceptions/lead-contact-invalid.exception';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';

export class UpdateLeadUseCase {
    constructor(
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
        @Inject(IOrganizationRepository)
        private readonly organizationRepository: IOrganizationRepository,
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(id: number, dto: UpdateLeadDto) {
        const lead = await this.leadRepository.findById(id);
        if (!lead) {
            throw new LeadNotFoundException(`Lead con id ${id} no encontrado`);
        }

        if (dto.idOrg !== undefined) {
            const organization = await this.organizationRepository.findById(
                dto.idOrg,
            );
            if (!organization) {
                throw new LeadNotFoundException(
                    `Organización con id ${dto.idOrg} no encontrada`,
                );
            }
            lead.id_org = dto.idOrg;
        }

        const effectiveOrg = dto.idOrg ?? lead.id_org;

        if (dto.idContacto !== undefined) {
            if (dto.idContacto !== null) {
                const contact = await this.contactRepository.findById(
                    dto.idContacto,
                );
                if (!contact) {
                    throw new LeadContactInvalidException(
                        `Contacto con id ${dto.idContacto} no encontrado`,
                    );
                }
                if (contact.idOrganizacion !== effectiveOrg) {
                    throw new LeadContactInvalidException(
                        'El contacto no pertenece a la organización asociada al Lead',
                    );
                }
                if (contact.estado_correo !== EstadoCorreo.VIGENTE) {
                    throw new LeadContactInvalidException(
                        'El contacto no se encuentra vigente',
                    );
                }
            }
            lead.id_contacto = dto.idContacto;
        }

        if (dto.idEncargado !== undefined) {
            const encargado = await this.userRepository.findById(
                dto.idEncargado,
            );
            if (!encargado) {
                throw new LeadNotFoundException(
                    `Encargado con id ${dto.idEncargado} no encontrado`,
                );
            }
            lead.id_encargado = dto.idEncargado;
        }

        if (dto.servicioInteres !== undefined) {
            lead.servicio_interes = dto.servicioInteres;
        }
        if (dto.comentarios !== undefined) {
            lead.comentarios = dto.comentarios;
        }
        if (dto.desafioOportunidad !== undefined) {
            lead.desafio_oportunidad = dto.desafioOportunidad;
        }
        if (dto.notasContacto !== undefined) {
            lead.notas_contacto = dto.notasContacto;
        }
        if (dto.canalCaptacion !== undefined) {
            lead.canal_captacion = dto.canalCaptacion;
        }

        lead.updated_at = new Date();

        return await this.leadRepository.saveWithRelations(lead);
    }
}
