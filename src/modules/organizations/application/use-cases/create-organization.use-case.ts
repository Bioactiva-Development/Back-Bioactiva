import { Inject } from '@/shared/dependency-inyection/inyect';
import { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { ISunatService } from '@/modules/organizations/domain/ports/sunat.service';
import { CreateOrganizationDto } from '@/modules/organizations/application/dtos/create-organization.dto';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { OrganizationAlreadyExistsException } from '@/modules/organizations/domain/exceptions/organization-already-exists.exception';
import { InvalidRucException } from '@/modules/organizations/domain/exceptions/invalid-ruc.exception';

export class CreateOrganizationUseCase {
    constructor(
        @Inject(IOrganizationRepository)
        private readonly organizationRepository: IOrganizationRepository,
        @Inject(ISunatService)
        private readonly sunatService: ISunatService,
    ) {}

    async execute(dto: CreateOrganizationDto): Promise<Organization> {
        if (dto.ruc) {
            // 1. Validar longitud del RUC
            if (!/^\d{11}$/.test(dto.ruc)) {
                throw new InvalidRucException(
                    dto.ruc,
                    'Ruc no cumple con 11 digitos. Verifique si su ruc es correcto o registre la org con un codigo unico para el sistema',
                );
            }

            // 2. Verificar duplicados localmente
            const existingOrg = await this.organizationRepository.findByRuc(
                dto.ruc,
            );
            if (existingOrg) {
                throw new OrganizationAlreadyExistsException(dto.ruc);
            }

            // 3. Validar existencia en SUNAT
            const isValidRuc = await this.sunatService.validateRuc(dto.ruc);
            if (!isValidRuc) {
                throw new InvalidRucException(
                    dto.ruc,
                    'No se encontraron resultados en SUNAT para la organización consultada.',
                );
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
