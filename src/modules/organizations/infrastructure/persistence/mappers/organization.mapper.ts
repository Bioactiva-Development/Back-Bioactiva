import { Organizacion as PrismaOrganizationModel } from '@prisma/client';
import { Organization } from '../../../domain/entities/organization';
import { EnterpriseType } from '../../../domain/enums/organization-type';
import { Sector } from '../../../domain/enums/sector';
import { Size } from '../../../domain/enums/size';

export class OrganizationMapper {
    static toDomain(raw: PrismaOrganizationModel): Organization {
        return new Organization(
            raw.id,
            raw.codigoCliente,
            raw.nombre,
            raw.nombreComercial,
            raw.subArea,
            raw.ruc,
            raw.tipo as EnterpriseType,
            raw.linkedin,
            raw.ubicacion,
            raw.sector as Sector | null,
            raw.tamano as Size,
            raw.actividadEconomica,
            raw.alianzasEstrategicas,
            raw.idContactoActivo,
            raw.idAuthor,
            raw.createdAt,
            raw.updatedAt,
        );
    }

    static toPersistence(
        domain: Organization,
    ): Omit<PrismaOrganizationModel, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            codigoCliente: domain.codigoCliente,
            nombre: domain.nombre,
            nombreComercial: domain.nombreComercial,
            subArea: domain.subArea,
            ruc: domain.ruc,
            tipo: domain.tipo,
            linkedin: domain.linkedin,
            ubicacion: domain.ubicacion,
            sector: domain.sector,
            tamano: domain.tamano,
            actividadEconomica: domain.actividadEconomica,
            alianzasEstrategicas: domain.alianzasEstrategicas,
            idContactoActivo: domain.idContactoActivo,
            idAuthor: domain.idAuthor,
        };
    }
}
