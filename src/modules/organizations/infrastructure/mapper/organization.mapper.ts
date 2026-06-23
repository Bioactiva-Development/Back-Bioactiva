import { Organizacion as PrismaOrganizationModel } from '@prisma/client';
import type {
    TipoEmpresa,
    Tamano as PrismaTamano,
    Sector as PrismaSector,
} from '@prisma/client';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

const enterpriseTypeMapToDomain: Record<TipoEmpresa, EnterpriseType> = {
    ACADEMIA: EnterpriseType.ACADEMIA,
    EMPRESA_INTERNACIONAL: EnterpriseType.EMPRESA_INTERNACIONAL,
    EMPRESA_NACIONAL: EnterpriseType.EMPRESA_NACIONAL,
    GOBIERNO_NACIONAL: EnterpriseType.GOBIERNO_NACIONAL,
    INDEPENDIENTE: EnterpriseType.INDEPENDIENTE,
    ONG: EnterpriseType.ONG,
    ORGANISMO_INTERNACIONAL: EnterpriseType.ORGANISMO_INTERNACIONAL,
};

const enterpriseTypeMapToPersistence: Record<EnterpriseType, TipoEmpresa> = {
    [EnterpriseType.ACADEMIA]: 'ACADEMIA',
    [EnterpriseType.EMPRESA_INTERNACIONAL]: 'EMPRESA_INTERNACIONAL',
    [EnterpriseType.EMPRESA_NACIONAL]: 'EMPRESA_NACIONAL',
    [EnterpriseType.GOBIERNO_NACIONAL]: 'GOBIERNO_NACIONAL',
    [EnterpriseType.INDEPENDIENTE]: 'INDEPENDIENTE',
    [EnterpriseType.ONG]: 'ONG',
    [EnterpriseType.ORGANISMO_INTERNACIONAL]: 'ORGANISMO_INTERNACIONAL',
};

const sizeMapToDomain: Record<PrismaTamano, Size> = {
    GRANDE: Size.GRANDE,
    MEDIANO: Size.MEDIANO,
    PEQUENO: Size.PEQUENO,
    MICRO: Size.MICRO,
};

const sizeMapToPersistence: Record<Size, PrismaTamano> = {
    [Size.GRANDE]: 'GRANDE',
    [Size.MEDIANO]: 'MEDIANO',
    [Size.PEQUENO]: 'PEQUENO',
    [Size.MICRO]: 'MICRO',
};

const sectorMapToDomain: Record<PrismaSector, Sector> = {
    ACUICULTURA: Sector.ACUICULTURA,
    ADMINISTRACION_PUBLICA: Sector.ADMINISTRACION_PUBLICA,
    AGRICOLA: Sector.AGRICOLA,
    AGROALIMENTARIA: Sector.AGROALIMENTARIA,
    AGROPECUARIO: Sector.AGROPECUARIO,
    ALIMENTARIA: Sector.ALIMENTARIA,
    ASESORIA: Sector.ASESORIA,
    BANCA_Y_SEGUROS: Sector.BANCA_Y_SEGUROS,
    CONSTRUCCION: Sector.CONSTRUCCION,
    CONSULTORIA: Sector.CONSULTORIA,
    COOPERACION_TECNICA: Sector.COOPERACION_TECNICA,
    EDUCACION: Sector.EDUCACION,
    ENERGIA: Sector.ENERGIA,
    FERRETERIA: Sector.FERRETERIA,
    FINANZAS: Sector.FINANZAS,
    FORESTAL: Sector.FORESTAL,
    GANADERIA: Sector.GANADERIA,
    INFORMATICA: Sector.INFORMATICA,
    MANUFACTURA: Sector.MANUFACTURA,
    MINERIA: Sector.MINERIA,
    OTROS: Sector.OTROS,
    PESCA: Sector.PESCA,
    SALUD: Sector.SALUD,
    TECNOLOGIA: Sector.TECNOLOGIA,
    TEXTIL: Sector.TEXTIL,
    TRANSFORMACION: Sector.TRANSFORMACION,
    TURISMO: Sector.TURISMO,
};

const sectorMapToPersistence: Record<Sector, PrismaSector> = {
    [Sector.ACUICULTURA]: 'ACUICULTURA',
    [Sector.ADMINISTRACION_PUBLICA]: 'ADMINISTRACION_PUBLICA',
    [Sector.AGRICOLA]: 'AGRICOLA',
    [Sector.AGROALIMENTARIA]: 'AGROALIMENTARIA',
    [Sector.AGROPECUARIO]: 'AGROPECUARIO',
    [Sector.ALIMENTARIA]: 'ALIMENTARIA',
    [Sector.ASESORIA]: 'ASESORIA',
    [Sector.BANCA_Y_SEGUROS]: 'BANCA_Y_SEGUROS',
    [Sector.CONSTRUCCION]: 'CONSTRUCCION',
    [Sector.CONSULTORIA]: 'CONSULTORIA',
    [Sector.COOPERACION_TECNICA]: 'COOPERACION_TECNICA',
    [Sector.EDUCACION]: 'EDUCACION',
    [Sector.ENERGIA]: 'ENERGIA',
    [Sector.FERRETERIA]: 'FERRETERIA',
    [Sector.FINANZAS]: 'FINANZAS',
    [Sector.FORESTAL]: 'FORESTAL',
    [Sector.GANADERIA]: 'GANADERIA',
    [Sector.INFORMATICA]: 'INFORMATICA',
    [Sector.MANUFACTURA]: 'MANUFACTURA',
    [Sector.MINERIA]: 'MINERIA',
    [Sector.OTROS]: 'OTROS',
    [Sector.PESCA]: 'PESCA',
    [Sector.SALUD]: 'SALUD',
    [Sector.TECNOLOGIA]: 'TECNOLOGIA',
    [Sector.TEXTIL]: 'TEXTIL',
    [Sector.TRANSFORMACION]: 'TRANSFORMACION',
    [Sector.TURISMO]: 'TURISMO',
};

export class OrganizationMapper {
    static toDomain(raw: PrismaOrganizationModel): Organization {
        return new Organization(
            raw.id,
            raw.codigoCliente,
            raw.nombre,
            raw.nombreComercial,
            raw.subArea,
            raw.ruc,
            enterpriseTypeMapToDomain[raw.tipo],
            raw.linkedin,
            raw.ubicacion,
            sectorMapToDomain[raw.sector],
            sizeMapToDomain[raw.tamano],
            raw.actividadEconomica,
            raw.alianzasEstrategicas,
            raw.idContactoActivo,
            raw.idAuthor,
            raw.createdAt,
            raw.updatedAt,
            raw.deletedAt,
        );
    }

    static toPersistence(
        domain: Organization,
    ): Omit<
        PrismaOrganizationModel,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    > {
        return {
            codigoCliente: domain.codigoCliente,
            nombre: domain.nombre,
            nombreComercial: domain.nombreComercial,
            subArea: domain.subArea,
            ruc: domain.ruc,
            tipo: enterpriseTypeMapToPersistence[domain.tipo],
            linkedin: domain.linkedin,
            ubicacion: domain.ubicacion,
            sector: sectorMapToPersistence[domain.sector],
            tamano: sizeMapToPersistence[domain.tamano],
            actividadEconomica: domain.actividadEconomica,
            alianzasEstrategicas: domain.alianzasEstrategicas,
            idContactoActivo: domain.idContactoActivo,
            idAuthor: domain.idAuthor,
        };
    }
}
