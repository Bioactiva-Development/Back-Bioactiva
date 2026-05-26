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

        // const decolectaInfo = await this.queryDecolecta(ruc);
        // if (decolectaInfo) {
        //     return decolectaInfo;
        // }

        // const apiPeruInfo = await this.queryApiPeru(ruc);
        // if (apiPeruInfo) {
        //     return apiPeruInfo;
        // }

        return null;
    }

    async getByRazonSocial(razonSocial: string): Promise<SunatCompanyInfo[]> {
        const pythonResults =
            await this.queryPythonScraperByRazonSocial(razonSocial);
        if (pythonResults && pythonResults.length > 0) {
            return pythonResults;
        }

        // if (this.apiPeruToken) {
        //     try {
        //         this.logger.log(
        //             `[SUNAT Scraper] Consultando APIPeru por Razón Social: ${razonSocial}`,
        //         );
        //         const response = await fetch(
        //             'https://apiperu.dev/api/ruc/search',
        //             {
        //                 method: 'POST',
        //                 headers: {
        //                     'Accept': 'application/json',
        //                     'Content-Type': 'application/json',
        //                     'Authorization': `Bearer ${this.apiPeruToken}`,
        //                 },
        //                 body: JSON.stringify({ razon_social: razonSocial }),
        //             },
        //         );

        //         if (response.ok) {
        //             const json: any = await response.json();
        //             const items = json.data || json;
        //             if (Array.isArray(items)) {
        //                 return items
        //                     .slice(0, 10)
        //                     .map((item: any) => this.mapApiPeruToCompany(item));
        //             }
        //         }
        //     } catch (error) {
        //         this.logger.error(
        //             `Error buscando Razón Social en APIPeru:`,
        //             error,
        //         );
        //     }
        // }

        return [];
    }

    // --- MÉTODOS DE INTEGRACIÓN CON EL SCRAPER EN PYTHON ---

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

        const rucMatch = rawRuc.match(/^(\d{11})\s*-\s*(.+)$/);

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

    // // --- MÉTODOS DE INTEGRACIÓN CON APIS DE CONTINGENCIA (DECOLECTA / APIPERU) ---

    // private async queryDecolecta(
    //     ruc: string,
    // ): Promise<SunatCompanyInfo | null> {
    //     const token = this.decolectaToken;
    //     if (!token) return null;

    //     try {
    //         const url = `https://api.decolecta.com/v1/sunat/ruc/full?numero=${ruc}`;
    //         const res = await fetch(url, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'x-api-key': token,
    //                 'Accept': 'application/json',
    //             },
    //         });

    //         if (!res.ok) {
    //             return null;
    //         }

    //         const json: any = await res.json();
    //         const data = json.data || json;

    //         if (data && (data.ruc || data.numero)) {
    //             return {
    //                 ruc: data.ruc || data.numero,
    //                 razonSocial:
    //                     data.razonSocial ||
    //                     data.razon_social ||
    //                     data.nombre ||
    //                     '',
    //                 nombreComercial:
    //                     data.nombreComercial ||
    //                     data.nombre_comercial ||
    //                     data.razonSocial ||
    //                     '',
    //                 tipo: this.detectEnterpriseType(
    //                     data.tipoContribuyente || data.tipo_contribuyente || '',
    //                 ),
    //                 ubicacion: data.direccion || data.ubicacion || 'LIMA',
    //                 actividadEconomica:
    //                     data.actividadEconomica ||
    //                     data.actividad_economica ||
    //                     '',
    //                 tamano: Size.MICRO,
    //                 sector: Sector.OTROS,
    //             };
    //         }

    //         return null;
    //     } catch (error) {
    //         this.logger.error(`Error consultando API Decolecta:`, error);
    //         return null;
    //     }
    // }

    // private async queryApiPeru(ruc: string): Promise<SunatCompanyInfo | null> {
    //     const token = this.apiPeruToken;
    //     if (!token) return null;

    //     try {
    //         const url = 'https://apiperu.dev/api/ruc';
    //         const res = await fetch(url, {
    //             method: 'POST',
    //             headers: {
    //                 'Accept': 'application/json',
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`,
    //             },
    //             body: JSON.stringify({ ruc }),
    //         });

    //         if (!res.ok) {
    //             return null;
    //         }

    //         const json: any = await res.json();
    //         const data = json.data || json;

    //         if (data && (data.ruc || data.numero)) {
    //             return this.mapApiPeruToCompany(data);
    //         }

    //         return null;
    //     } catch (error) {
    //         this.logger.error(`Error consultando APIPeru.dev:`, error);
    //         return null;
    //     }
    // }

    // private mapApiPeruToCompany(data: any): SunatCompanyInfo {
    //     const ruc = data.ruc || data.numero || '';
    //     const razonSocial =
    //         data.nombre_o_razon_social ||
    //         data.razon_social ||
    //         data.nombre ||
    //         '';
    //     const tipoContribuyente = data.tipo_contribuyente || data.tipo || '';

    //     return {
    //         ruc,
    //         razonSocial,
    //         nombreComercial: data.nombre_comercial || razonSocial,
    //         tipo: this.detectEnterpriseType(tipoContribuyente),
    //         ubicacion: data.direccion || data.ubicacion || 'LIMA',
    //         actividadEconomica: data.actividad_economica || '',
    //         tamano: Size.MICRO,
    //         sector: Sector.OTROS,
    //     };
    // }

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
