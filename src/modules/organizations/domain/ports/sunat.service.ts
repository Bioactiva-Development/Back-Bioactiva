import { EnterpriseType } from '@modules/organizations/domain/enums/organization-type';
import { Sector } from '@modules/organizations/domain/enums/sector';
import { Size } from '@modules/organizations/domain/enums/size';

export interface SunatCompanyInfo {
    ruc: string;
    razonSocial: string;
    nombreComercial: string;
    tipo: EnterpriseType;
    ubicacion: string | null;
    actividadEconomica: string | null;
    tamano: Size;
    sector: Sector | null;
}

export interface ISunatService {
    validateRuc(ruc: string): Promise<boolean>;
    getByRuc(ruc: string): Promise<SunatCompanyInfo | null>;
    getByRazonSocial(razonSocial: string): Promise<SunatCompanyInfo[]>;
}

export const ISunatService = Symbol('ISunatService');
