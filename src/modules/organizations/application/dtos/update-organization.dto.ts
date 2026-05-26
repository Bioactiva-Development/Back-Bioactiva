import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

export class UpdateOrganizationDto {
    constructor(
        public readonly codigoCliente?: string,
        public readonly nombre?: string,
        public readonly nombreComercial?: string,
        public readonly subArea?: string | null,
        public readonly ruc?: string | null,
        public readonly tipo?: EnterpriseType,
        public readonly linkedin?: string | null,
        public readonly ubicacion?: string | null,
        public readonly sector?: Sector | null,
        public readonly tamano?: Size,
        public readonly actividadEconomica?: string | null,
        public readonly alianzasEstrategicas?: string | null,
        public readonly idContactoActivo?: number | null,
        public readonly idAuthor?: number,
    ) {}
}
