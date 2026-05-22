import { EnterpriseType } from '../../domain/enums/organization-type';
import { Sector } from '../../domain/enums/sector';
import { Size } from '../../domain/enums/size';

export class CreateOrganizationDto {
    constructor(
        public readonly codigoCliente: string,
        public readonly nombre: string, // Razón Social
        public readonly nombreComercial: string,
        public readonly subArea: string | null,
        public readonly ruc: string | null,
        public readonly tipo: EnterpriseType,
        public readonly linkedin: string | null,
        public readonly ubicacion: string | null,
        public readonly sector: Sector | null,
        public readonly tamano: Size,
        public readonly actividadEconomica: string | null,
        public readonly alianzasEstrategicas: string | null,
        public readonly idContactoActivo: number | null,
        public readonly idAuthor: number,
    ) {}
}
