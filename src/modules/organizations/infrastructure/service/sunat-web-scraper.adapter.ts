import { Injectable, Logger } from '@nestjs/common';
import {
    ISunatService,
    SunatCompanyInfo,
} from '@/modules/organizations/domain/ports/sunat.service';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

interface PythonScraperResponse {
    resultados: PythonScraperResult[];
}

interface PythonScraperResult {
    ruc?: string;
    numero_de_ruc?: string;
    'número_de_ruc'?: string;
    tipo_contribuyente?: string;
    nombre_comercial?: string | null;
    domicilio_fiscal?: string | null;
    actividad_economica?: string | null;
    actividades_economicas?: string | null;
    'actividades_económicas'?: string | null;
    error?: string;
    [key: string]: unknown;
}

@Injectable()
export class SunatWebScraperAdapter implements ISunatService {
    private readonly logger = new Logger(SunatWebScraperAdapter.name);
    private readonly pythonScraperBaseUrl: string;

    constructor() {
        this.pythonScraperBaseUrl =
            process.env.PYTHON_SCRAPER_URL ?? 'http://localhost:8000';
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

        const pythonInfo = await this.queryPythonScraperByRuc(ruc);
        if (pythonInfo) {
            return pythonInfo;
        }

        return null;
    }

    async getByRazonSocial(razonSocial: string): Promise<SunatCompanyInfo[]> {
        const pythonResults =
            await this.queryPythonScraperByRazonSocial(razonSocial);
        if (pythonResults && pythonResults.length > 0) {
            return pythonResults;
        }

        return [];
    }

    private async queryPythonScraperByRuc(
        ruc: string,
    ): Promise<SunatCompanyInfo | null> {
        try {
            const url = `${this.pythonScraperBaseUrl}/consulta-ruc/${ruc}`;
            const response = await fetch(url, {
                signal: AbortSignal.timeout(60000),
            });
            if (!response.ok) return null;

            const body = (await response.json()) as PythonScraperResponse;

            if (
                !Array.isArray(body.resultados) ||
                body.resultados.length === 0
            ) {
                this.logger.warn(
                    `Respuesta inesperada del scraper Python para RUC ${ruc}: ${JSON.stringify(body).slice(0, 500)}`,
                );
                return null;
            }

            return this.mapPythonResultToCompany(body.resultados[0]);
        } catch (error) {
            this.logger.warn(
                `Python Scraper no disponible o falló para RUC ${ruc} - Error: ${error instanceof Error ? error.message : String(error)}`,
            );
            return null;
        }
    }

    private async queryPythonScraperByRazonSocial(
        razonSocial: string,
    ): Promise<SunatCompanyInfo[] | null> {
        try {
            const url = `${this.pythonScraperBaseUrl}/consulta/${encodeURIComponent(razonSocial)}`;
            const response = await fetch(url, {
                signal: AbortSignal.timeout(120000),
            });
            if (!response.ok) return null;

            const body = (await response.json()) as PythonScraperResponse;

            if (
                !Array.isArray(body.resultados) ||
                body.resultados.length === 0
            ) {
                this.logger.warn(
                    `Respuesta inesperada del scraper Python para Razón Social ${razonSocial}: ${JSON.stringify(body).slice(0, 500)}`,
                );
                return null;
            }

            return body.resultados
                .map((res) => this.mapPythonResultToCompany(res))
                .filter((r): r is SunatCompanyInfo => r !== null);
        } catch (error) {
            this.logger.warn(
                `Python Scraper no disponible o falló para Razón Social ${razonSocial} - Error: ${error instanceof Error ? error.message : String(error)}`,
            );
            return null;
        }
    }

    private mapPythonResultToCompany(
        res: PythonScraperResult,
    ): SunatCompanyInfo | null {
        if (res.error) {
            this.logger.warn(`Error en scraper Python: ${res.error}`);
            return null;
        }

        const rawRuc =
            res.ruc ?? res.numero_de_ruc ?? res['número_de_ruc'] ?? undefined;

        if (!rawRuc) {
            this.logger.warn(
                `Respuesta del scraper Python sin campo 'ruc': ${JSON.stringify(res).slice(0, 500)}`,
            );
            return null;
        }

        const rucMatch = rawRuc.match(/^(\d{11})\s*-\s*([^\n\r]+)$/);

        const ruc = rucMatch ? rucMatch[1] : rawRuc;
        const razonSocial = rucMatch ? rucMatch[2].trim() : '';

        const actividadEconomica =
            res.actividad_economica ??
            res.actividades_economicas ??
            res['actividades_económicas'] ??
            null;

        return {
            ruc,
            razonSocial,
            nombreComercial: res.nombre_comercial ?? razonSocial,
            tipo: this.detectEnterpriseType(res.tipo_contribuyente ?? ''),
            ubicacion: res.domicilio_fiscal ?? 'LIMA',
            actividadEconomica,
            tamano: Size.MICRO,
            sector: Sector.OTROS,
        };
    }

    private detectEnterpriseType(tipoContribuyente: string): EnterpriseType {
        const clean = tipoContribuyente.toUpperCase();
        if (
            clean.includes('PERSONA NATURAL') ||
            clean.includes('INDEPENDIENTE')
        ) {
            return EnterpriseType.INDEPENDIENTE;
        }
        if (clean.includes('ONG') || clean.includes('ASOCIACION')) {
            return EnterpriseType.ONG;
        }
        if (clean.includes('GOBIERNO') || clean.includes('MUNICIPALIDAD')) {
            return EnterpriseType.GOBIERNO_NACIONAL;
        }
        return EnterpriseType.EMPRESA_NACIONAL;
    }
}
