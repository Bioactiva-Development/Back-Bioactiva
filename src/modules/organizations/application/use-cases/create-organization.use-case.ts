import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import { ORGANIZATION_REPOSITORY } from '@/modules/organizations/domain/ports/organization.repository';
import type { IOrganizationRepository } from '@/modules/organizations/domain/ports/organization.repository';
import { CreateOrganizationDto } from '@/modules/organizations/application/dtos/create-organization.dto';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { InvalidRucException } from '@/modules/organizations/domain/exceptions/invalid-ruc.exception';
import { DuplicateClientCodeException } from '@/modules/organizations/domain/exceptions/duplicate-client-code.exception';

export class CreateOrganizationUseCase {
    constructor(
        @Inject(ORGANIZATION_REPOSITORY)
        private readonly organizationRepository: IOrganizationRepository,
    ) {}

    async execute(dto: CreateOrganizationDto): Promise<Organization> {
        if (dto.ruc) {
            if (!/^\d{11}$/.test(dto.ruc)) {
                throw new InvalidRucException(
                    dto.ruc,
                    'Ruc no cumple con 11 digitos. Verifique si su ruc es correcto o registre la org con un codigo unico para el sistema',
                );
            }

            // El RUC se preserva incluso en orgs eliminadas (findByRuc ve todas
            // las filas). Si ya existe un registro con ese RUC, no se duplica:
            // se reutiliza ese registro, se restaura si estaba eliminado y se
            // sobrescriben sus datos con el nuevo payload.
            const existingOrg = await this.organizationRepository.findByRuc(
                dto.ruc,
            );
            if (existingOrg) {
                return this.reuseExistingOrganization(existingOrg, dto);
            }
        }

        const existingByCode =
            await this.organizationRepository.findByCodigoCliente(
                dto.codigoCliente,
            );
        if (existingByCode) {
            throw new DuplicateClientCodeException(dto.codigoCliente);
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

    /**
     * Reutiliza un registro existente identificado por su RUC: lo restaura si
     * estaba eliminado (soft-delete) y sobrescribe todos sus campos con el
     * nuevo payload. El nuevo `codigoCliente` no puede pertenecer a OTRA
     * organización distinta de la que se está reutilizando.
     */
    private async reuseExistingOrganization(
        existing: Organization,
        dto: CreateOrganizationDto,
    ): Promise<Organization> {
        if (dto.codigoCliente !== existing.codigoCliente) {
            const byCode =
                await this.organizationRepository.findByCodigoCliente(
                    dto.codigoCliente,
                );
            if (byCode && byCode.id !== existing.id) {
                throw new DuplicateClientCodeException(dto.codigoCliente);
            }
        }

        existing.codigoCliente = dto.codigoCliente;
        existing.nombre = dto.nombre;
        existing.nombreComercial = dto.nombreComercial;
        existing.subArea = dto.subArea;
        existing.ruc = dto.ruc;
        existing.tipo = dto.tipo;
        existing.linkedin = dto.linkedin;
        existing.ubicacion = dto.ubicacion;
        existing.sector = dto.sector;
        existing.tamano = dto.tamano;
        existing.actividadEconomica = dto.actividadEconomica;
        existing.alianzasEstrategicas = dto.alianzasEstrategicas;
        existing.idContactoActivo = dto.idContactoActivo;
        existing.idAuthor = dto.idAuthor;
        existing.deletedAt = null; // restaura si estaba soft-deleted
        existing.updatedAt = new Date();

        return await this.organizationRepository.save(existing);
    }
}
