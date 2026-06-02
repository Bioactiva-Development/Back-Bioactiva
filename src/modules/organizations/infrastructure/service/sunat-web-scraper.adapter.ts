import { Injectable, Logger } from '@nestjs/common';
import {
    SUNAT_SERVICE,
    type ISunatService,
    SunatCompanyInfo,
} from '@/modules/organizations/domain/ports/sunat.service';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

interface PythonScraperRucResponse {
    ruc?: string;
    nombre?: string;
    tipoContribuyente?: string;
    nombreComercial?: string | null;
    ubicacion?: string | null;
    actividadEconomica?: string | null;
    tipo?: string | null;
    sector?: string | null;
    tamano?: string | null;
    estado?: string;
    [key: string]: unknown;
}

interface PythonScraperNombreResult {
    ruc?: string;
    nombre?: string;
    ubicacion?: string | null;
    estado?: string;
}

@Injectable()
export class SunatWebScraperAdapter implements ISunatService {
    private readonly logger = new Logger(SunatWebScraperAdapter.name);
    private readonly pythonScraperBaseUrl: string;

    constructor() {
        this.pythonScraperBaseUrl = process.env.PYTHON_SCRAPER_URL!;
    }

    async validateRuc(ruc: string): Promise<boolean> {
        this.logger.log(`Validando RUC en SUNAT: ${ruc}`);
        if (!/^\d{11}$/.test(ruc)) {
            return false;
        }
        const company = await this.getByRuc(ruc);
        return company !== null;
    }

    async getByRuc(ruc: string): Promise<SunatCompanyInfo | null> {
        if (!/^\d{11}$/.test(ruc)) {
            return null;
        }

        try {
            const url = `${this.pythonScraperBaseUrl}/consultar-ruc?ruc=${ruc}`;
            const response = await fetch(url, {
                signal: AbortSignal.timeout(60000),
            });

            if (response.status === 404) {
                this.logger.warn(`RUC ${ruc} no encontrado en SUNAT`);
                return null;
            }

            if (!response.ok) {
                this.logger.warn(`Scraper respondió con ${response.status} para RUC ${ruc}`);
                return null;
            }

            const body = (await response.json()) as PythonScraperRucResponse;

            if (!body.ruc) {
                this.logger.warn(`Respuesta del scraper sin campo 'ruc': ${JSON.stringify(body).slice(0, 500)}`);
                return null;
            }

            return this.mapRucResponseToCompany(body);
        } catch (error) {
            this.logger.warn(
                `Python Scraper no disponible para RUC ${ruc} - ${error instanceof Error ? error.message : String(error)}`,
            );
            return null;
        }
    }

    async getByRazonSocial(razonSocial: string): Promise<SunatCompanyInfo[]> {
        try {
            const url = `${this.pythonScraperBaseUrl}/consultar-nombre?nombre=${encodeURIComponent(razonSocial)}`;
            const response = await fetch(url, {
                signal: AbortSignal.timeout(120000),
            });

            if (!response.ok) {
                this.logger.warn(`Scraper respondió con ${response.status} para nombre ${razonSocial}`);
                return [];
            }

            const body = (await response.json()) as PythonScraperNombreResult[];

            if (!Array.isArray(body) || body.length === 0) {
                return [];
            }

            return body
                .map((res) => this.mapNombreResultToCompany(res))
                .filter((r): r is SunatCompanyInfo => r !== null);
        } catch (error) {
            this.logger.warn(
                `Python Scraper no disponible para nombre ${razonSocial} - ${error instanceof Error ? error.message : String(error)}`,
            );
            return [];
        }
    }

    private mapRucResponseToCompany(res: PythonScraperRucResponse): SunatCompanyInfo {
        return {
            ruc: res.ruc!,
            razonSocial: res.nombre ?? '',
            nombreComercial: res.nombreComercial ?? res.nombre ?? '',
            tipo: this.mapEnterpriseType(res.tipo),
            ubicacion: res.ubicacion ?? 'LIMA',
            actividadEconomica: res.actividadEconomica ?? null,
            tamano: Size.MICRO,
            sector: this.mapSector(res.sector),
        };
    }

    private mapNombreResultToCompany(res: PythonScraperNombreResult): SunatCompanyInfo | null {
        if (!res.ruc) {
            return null;
        }
        return {
            ruc: res.ruc,
            razonSocial: res.nombre ?? '',
            nombreComercial: res.nombre ?? '',
            tipo: EnterpriseType.EMPRESA_NACIONAL,
            ubicacion: res.ubicacion ?? 'LIMA',
            actividadEconomica: null,
            tamano: Size.MICRO,
            sector: Sector.OTROS,
        };
    }

    private mapEnterpriseType(tipo: string | null | undefined): EnterpriseType {
        if (!tipo) return EnterpriseType.EMPRESA_NACIONAL;
        const upper = tipo.toUpperCase() as keyof typeof EnterpriseType;
        if (upper in EnterpriseType) {
            return EnterpriseType[upper];
        }
        return EnterpriseType.EMPRESA_NACIONAL;
    }

    private mapSector(sector: string | null | undefined): Sector | null {
        if (!sector) return null;
        const upper = sector.toUpperCase() as keyof typeof Sector;
        if (upper in Sector) {
            return Sector[upper];
        }
        return null;
    }
}
