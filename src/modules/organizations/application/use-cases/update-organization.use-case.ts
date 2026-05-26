import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { ISunatService } from '@/modules/organizations/domain/ports/sunat.service';
import { UpdateOrganizationDto } from '@/modules/organizations/application/dtos/update-organization.dto';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { OrganizationAlreadyExistsException } from '@/modules/organizations/domain/exceptions/organization-already-exists.exception';
import { InvalidRucException } from '@/modules/organizations/domain/exceptions/invalid-ruc.exception';

export class UpdateOrganizationUseCase {
    constructor(
        @Inject(IOrganizationRepository)
        private readonly organizationRepository: IOrganizationRepository,
        @Inject(ISunatService)
        private readonly sunatService: ISunatService,
    ) {}

    async execute(
        id: string,
        dto: UpdateOrganizationDto,
    ): Promise<Organization> {
        const organization = await this.organizationRepository.findById(id);
        if (!organization) {
            throw new Error('Organización no encontrada');
        }

        if (dto.ruc && dto.ruc !== organization.ruc) {
            const existingOrg = await this.organizationRepository.findByRuc(
                dto.ruc,
            );
            if (existingOrg) {
                throw new OrganizationAlreadyExistsException(dto.ruc);
            }

            const isValidRuc = await this.sunatService.validateRuc(dto.ruc);
            if (!isValidRuc) {
                throw new InvalidRucException(dto.ruc);
            }
            organization.ruc = dto.ruc;
        }

        if (dto.nombre) {
            organization.rename(dto.nombre);
        }
        if (dto.nombreComercial) {
            organization.updateCommercialName(dto.nombreComercial);
        }
        if (dto.codigoCliente) {
            organization.codigoCliente = dto.codigoCliente;
        }
        if (dto.subArea !== undefined) {
            organization.subArea = dto.subArea;
        }
        if (dto.tipo) {
            organization.tipo = dto.tipo;
        }
        if (dto.linkedin !== undefined) {
            organization.linkedin = dto.linkedin;
        }
        if (dto.ubicacion !== undefined) {
            organization.ubicacion = dto.ubicacion;
        }
        if (dto.sector !== undefined) {
            organization.sector = dto.sector;
        }
        if (dto.tamano) {
            organization.tamano = dto.tamano;
        }
        if (dto.actividadEconomica !== undefined) {
            organization.actividadEconomica = dto.actividadEconomica;
        }
        if (dto.alianzasEstrategicas !== undefined) {
            organization.alianzasEstrategicas = dto.alianzasEstrategicas;
        }
        if (dto.idContactoActivo !== undefined) {
            organization.idContactoActivo = dto.idContactoActivo;
        }

        organization.updatedAt = new Date();

        return await this.organizationRepository.save(organization);
    }
}
