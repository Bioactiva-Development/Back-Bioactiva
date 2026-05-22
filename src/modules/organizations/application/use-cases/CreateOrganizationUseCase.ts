import { Inject } from '@/shared/dependency-inyection/inyect';
import { IOrganizationRepository } from '../../domain/ports/organization.repository';
import { ISunatService } from '../../domain/ports/sunat.service';
import { CreateOrganizationDto } from '../dtos/create-organization.dto';
import { Organization } from '../../domain/entities/organization';
import { OrganizationAlreadyExistsException } from '../../domain/exceptions/organization-already-exists.exception';
import { InvalidRucException } from '../../domain/exceptions/invalid-ruc.exception';

export class CreateOrganizationUseCase {
    constructor(
        @Inject(IOrganizationRepository)
        private readonly organizationRepository: IOrganizationRepository,
        @Inject(ISunatService)
        private readonly sunatService: ISunatService,
    ) {}

    async execute(dto: CreateOrganizationDto): Promise<Organization> {
        if (dto.ruc) {
            const existingOrg = await this.organizationRepository.findByRuc(dto.ruc);
            if (existingOrg) {
                throw new OrganizationAlreadyExistsException(dto.ruc);
            }

            const isValidRuc = await this.sunatService.validateRuc(dto.ruc);
            if (!isValidRuc) {
                throw new InvalidRucException(dto.ruc);
            }
        }

        const organization = new Organization(
            '', // UUID será autogenerado en BD/Mapper
            dto.codigoCliente,
            dto.nombre,
            dto.nombreComercial,
            dto.subArea,
            dto.ruc,
            dto.tipo,
            dto.linkedin,
            dto.ubicacion,
            dto.sector,
            dto.tamano,
            dto.actividadEconomica,
            dto.alianzasEstrategicas,
            dto.idContactoActivo,
            dto.idAuthor,
            new Date(),
            new Date(),
        );

        return await this.organizationRepository.save(organization);
    }
}
