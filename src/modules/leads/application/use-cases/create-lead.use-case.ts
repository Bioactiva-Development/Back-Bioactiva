import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    LEAD_REPOSITORY,
    type LeadRepository,
} from '@/modules/leads/domain/ports/lead-repository.port';
import {
    ORGANIZATION_REPOSITORY,
    type IOrganizationRepository,
} from '@/modules/organizations/domain/ports/organization.repository';
import { IContactRepository } from '@/modules/contacts/domain/ports/contact.repository';
import {
    USER_REPOSITORY,
    type UserRepositoryPort,
} from '@/modules/users/domain/ports/user-repository.port';
import { CreateLeadDto } from '@/modules/leads/application/dto/create-lead.dto';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadContactInvalidException } from '@/modules/leads/domain/exceptions/lead-contact-invalid.exception';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { EstadoCorreo } from '@/modules/contacts/domain/enums/estado-correo';

export class CreateLeadUseCase {
    constructor(
        @Inject(LEAD_REPOSITORY)
        private readonly leadRepository: LeadRepository,
        @Inject(ORGANIZATION_REPOSITORY)
        private readonly organizationRepository: IOrganizationRepository,
        @Inject(IContactRepository)
        private readonly contactRepository: IContactRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(dto: CreateLeadDto) {
        const organization = await this.organizationRepository.findById(
            dto.idOrg,
        );
        if (!organization) {
            throw new LeadNotFoundException(
                `Organización con id ${dto.idOrg} no encontrada`,
            );
        }

        if (dto.idContacto !== null && dto.idContacto !== undefined) {
            const contact = await this.contactRepository.findById(
                dto.idContacto,
            );
            if (!contact) {
                throw new LeadContactInvalidException(
                    `Contacto con id ${dto.idContacto} no encontrado`,
                );
            }
            if (contact.idOrganizacion !== dto.idOrg) {
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

        const encargado = await this.userRepository.findById(dto.idEncargado);
        if (!encargado) {
            throw new LeadNotFoundException(
                `Encargado con id ${dto.idEncargado} no encontrado`,
            );
        }

        const lead = new Lead(
            null,
            dto.idOrg,
            dto.idContacto ?? null,
            LeadState.EN_PROSPECTO,
            dto.servicioInteres,
            dto.comentarios,
            dto.desafioOportunidad,
            dto.idEncargado,
            dto.canalCaptacion,
            dto.idAuthor,
            new Date(),
            new Date(),
            null,
            new Date(),
        );

        return await this.leadRepository.saveWithRelations(lead);
    }
}
