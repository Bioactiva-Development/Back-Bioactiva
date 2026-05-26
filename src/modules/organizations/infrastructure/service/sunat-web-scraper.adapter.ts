import { Injectable, Logger } from '@nestjs/common';
import { ISunatService, SunatCompanyInfo } from '../../domain/ports/sunat.service';
import { EnterpriseType } from '../../domain/enums/organization-type';
import { Sector } from '../../domain/enums/sector';
import { Size } from '../../domain/enums/size';

@Injectable()
export class SunatWebScraperAdapter implements ISunatService {
    private readonly logger = new Logger(SunatWebScraperAdapter.name);
    private readonly pythonScraperBaseUrl = 'http://localhost:8000';

    // Diccionario de simulación de SUNAT / Fallback local para desarrollo y pruebas
    private readonly dbSimulada: SunatCompanyInfo[] = [
        {
            ruc: '10730315550',
            razonSocial: 'ESCOBAR PEREZ YURI ABEL',
            nombreComercial: 'ESCOBAR PEREZ YURI ABEL',
            tipo: EnterpriseType.INDEPENDIENTE,
            ubicacion: 'AREQUIPA',
            actividadEconomica: 'OTRAS ACTIVIDADES DE SERVICIOS PERSONALES N.C.P.',
            tamano: Size.MICRO,
            sector: Sector.OTROS,
        },
        {
            ruc: '10418765963',
            razonSocial: 'ESCOBAR MEJIA YURI ABEL',
            nombreComercial: 'ESCOBAR MEJIA YURI ABEL',
            tipo: EnterpriseType.INDEPENDIENTE,
            ubicacion: 'LIMA',
            actividadEconomica: 'OTRAS ACTIVIDADES DE SERVICIOS PERSONALES N.C.P.',
            tamano: Size.MICRO,
            sector: Sector.OTROS,
        },
        {
            ruc: '20555444332',
            razonSocial: 'Organizacion General S.A.',
            nombreComercial: 'Organizacion General',
            tipo: EnterpriseType.EMPRESA_NACIONAL,
            ubicacion: 'San Isidro, Lima',
            actividadEconomica: 'Servicios de Consultoría Tecnológica',
            tamano: Size.GRANDE,
            sector: Sector.TECNOLOGIA,
        },
        {
            ruc: '20123456789',
            razonSocial: 'E2E Organization Inc',
            nombreComercial: 'E2E Org Inc',
            tipo: EnterpriseType.EMPRESA_INTERNACIONAL,
            ubicacion: 'Miraflores, Lima',
            actividadEconomica: 'Desarrollo de Software',
            tamano: Size.PEQUENO,
            sector: Sector.TECNOLOGIA,
        }
    ];

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

        // --- INTENTO 1: Python Scraper API (Localhost) ---
        this.logger.log(`[SUNAT Scraper] Intentando consulta a Python Scraper local: ${this.pythonScraperBaseUrl}/consulta-ruc/${ruc}`);
        const pythonInfo = await this.queryPythonScraperByRuc(ruc);
        if (pythonInfo) {
            this.logger.log(`[SUNAT Scraper] Éxito obteniendo RUC '${ruc}' desde Python Scraper.`);
            return pythonInfo;
        }

        // --- INTENTO 2: Fallback a API Decolecta ---
        const decolectaToken = process.env.DECOLECTA_API_SUNAT_TOKEN;
        if (decolectaToken) {
            this.logger.log(`[SUNAT Scraper] Fallback: consultando API Decolecta para RUC: ${ruc}`);
            const decolectaInfo = await this.queryDecolecta(ruc, decolectaToken);
            if (decolectaInfo) {
                return decolectaInfo;
            }
        }

        // --- INTENTO 3: Fallback a API Peru ---
        const apiPeruToken = process.env.APIPERU_TOKEN;
        if (apiPeruToken) {
            this.logger.log(`[SUNAT Scraper] Fallback: consultando APIPeru.dev para RUC: ${ruc}`);
            const apiPeruInfo = await this.queryApiPeru(ruc, apiPeruToken);
            if (apiPeruInfo) {
                return apiPeruInfo;
            }
        }

        // --- INTENTO 4: Fallback a Base de Datos Local Simulada ---
        this.logger.log(`[SUNAT Scraper] Fallback: consultando base simulada local para RUC: ${ruc}`);
        const simulated = this.dbSimulada.find((c) => c.ruc === ruc) || null;
        if (simulated) {
            this.logger.log(`[SUNAT Scraper] RUC '${ruc}' obtenido de base local simulada.`);
        }
        return simulated;
    }

    async getByRazonSocial(razonSocial: string): Promise<SunatCompanyInfo[]> {
        const queryClean = razonSocial.trim().toLowerCase();

        // --- INTENTO 1: Python Scraper API (Localhost) ---
        this.logger.log(`[SUNAT Scraper] Intentando consulta por Razón Social a Python Scraper local...`);
        const pythonResults = await this.queryPythonScraperByRazonSocial(razonSocial);
        if (pythonResults && pythonResults.length > 0) {
            return pythonResults;
        }

        // --- INTENTO 2: Buscar en la base simulada local ---
        const localMatches = this.dbSimulada.filter((company) =>
            company.razonSocial.toLowerCase().includes(queryClean)
        );
        if (localMatches.length > 0) {
            this.logger.log(`[SUNAT Scraper] Búsqueda por Razón Social '${razonSocial}' resuelta con base local.`);
            return localMatches.slice(0, 10);
        }

        // --- INTENTO 3: Buscar en APIPeru ---
        const apiPeruToken = process.env.APIPERU_TOKEN;
        if (apiPeruToken) {
            try {
                this.logger.log(`[SUNAT Scraper] Consultando APIPeru por Razón Social: ${razonSocial}`);
                const response = await fetch('https://apiperu.dev/api/ruc/search', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiPeruToken}`,
                    },
                    body: JSON.stringify({ razon_social: razonSocial }),
                });

                if (response.ok) {
                    const json: any = await response.json();
                    const items = json.data || json;
                    if (Array.isArray(items)) {
                        return items.slice(0, 10).map((item: any) => this.mapApiPeruToCompany(item));
                    }
                }
            } catch (error) {
                this.logger.error(`Error buscando Razón Social en APIPeru:`, error);
            }
        }

        return [];
    }

    // --- MÉTODOS DE INTEGRACIÓN CON EL SCRAPER EN PYTHON ---

    private async queryPythonScraperByRuc(ruc: string): Promise<SunatCompanyInfo | null> {
        try {
            const url = `${this.pythonScraperBaseUrl}/consulta-ruc/${ruc}`;
            const response = await fetch(url, { signal: AbortSignal.timeout(10000) }); // Timeout de 10s
            if (!response.ok) return null;

            const json: any = await response.json();
            const resultados = json.resultados;

            if (Array.isArray(resultados) && resultados.length > 0) {
                return this.mapPythonResultToCompany(resultados[0]);
            }
            return null;
        } catch (error) {
            this.logger.warn(`Python Scraper no disponible o falló para RUC ${ruc}: ${error.message}`);
            return null;
        }
    }

    private async queryPythonScraperByRazonSocial(razonSocial: string): Promise<SunatCompanyInfo[] | null> {
        try {
            const url = `${this.pythonScraperBaseUrl}/consulta/${encodeURIComponent(razonSocial)}`;
            const response = await fetch(url, { signal: AbortSignal.timeout(15000) }); // Timeout de 15s
            if (!response.ok) return null;

            const json: any = await response.json();
            const resultados = json.resultados;

            if (Array.isArray(resultados) && resultados.length > 0) {
                return resultados.map((res: any) => this.mapPythonResultToCompany(res));
            }
            return null;
        } catch (error) {
            this.logger.warn(`Python Scraper no disponible o falló para Razón Social ${razonSocial}: ${error.message}`);
            return null;
        }
    }

    private mapPythonResultToCompany(res: any): SunatCompanyInfo {
        const nroRucRaw = res.número_de_ruc || res.numero_de_ruc || '';
        const matchRuc = nroRucRaw.match(/^(\d{11})\s*-\s*(.+)$/);
        
        const ruc = matchRuc ? matchRuc[1] : nroRucRaw;
        const razonSocial = matchRuc ? matchRuc[2].trim() : nroRucRaw;

        const tipoContribuyente = res.tipo_contribuyente || '';
        const ubicacion = res.domicilio_fiscal || 'LIMA';
        const actividadEconomica = res.actividades_económicas || res.actividades_economicas || '';

        return {
            ruc,
            razonSocial,
            nombreComercial: res.nombre_comercial || razonSocial,
            tipo: this.detectEnterpriseType(tipoContribuyente),
            ubicacion,
            actividadEconomica,
            tamano: Size.MICRO,
            sector: Sector.OTROS,
        };
    }

    // --- MÉTODOS DE INTEGRACIÓN CON APIS DE CONTINGENCIA (DECOLECTA / APIPERU) ---

    private async queryDecolecta(ruc: string, token: string): Promise<SunatCompanyInfo | null> {
        try {
            const url = `https://api.decolecta.com/v1/sunat/ruc/full?numero=${ruc}`;
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': token,
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) {
                return null;
            }

            const json: any = await res.json();
            const data = json.data || json;

            if (data && (data.ruc || data.numero)) {
                return {
                    ruc: data.ruc || data.numero,
                    razonSocial: data.razonSocial || data.razon_social || data.nombre || '',
                    nombreComercial: data.nombreComercial || data.nombre_comercial || data.razonSocial || '',
                    tipo: this.detectEnterpriseType(data.tipoContribuyente || data.tipo_contribuyente || ''),
                    ubicacion: data.direccion || data.ubicacion || 'LIMA',
                    actividadEconomica: data.actividadEconomica || data.actividad_economica || '',
                    tamano: Size.MICRO,
                    sector: Sector.OTROS,
                };
            }

            return null;
        } catch (error) {
            this.logger.error(`Error consultando API Decolecta:`, error);
            return null;
        }
    }

    private async queryApiPeru(ruc: string, token: string): Promise<SunatCompanyInfo | null> {
        try {
            const url = 'https://apiperu.dev/api/ruc';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ruc })
            });

            if (!res.ok) {
                return null;
            }

            const json: any = await res.json();
            const data = json.data || json;

            if (data && (data.ruc || data.numero)) {
                return this.mapApiPeruToCompany(data);
            }

            return null;
        } catch (error) {
            this.logger.error(`Error consultando APIPeru.dev:`, error);
            return null;
        }
    }

    private mapApiPeruToCompany(data: any): SunatCompanyInfo {
        const ruc = data.ruc || data.numero || '';
        const razonSocial = data.nombre_o_razon_social || data.razon_social || data.nombre || '';
        const tipoContribuyente = data.tipo_contribuyente || data.tipo || '';
        
        return {
            ruc,
            razonSocial,
            nombreComercial: data.nombre_comercial || razonSocial,
            tipo: this.detectEnterpriseType(tipoContribuyente),
            ubicacion: data.direccion || data.ubicacion || 'LIMA',
            actividadEconomica: data.actividad_economica || '',
            tamano: Size.MICRO,
            sector: Sector.OTROS,
        };
    }

    private detectEnterpriseType(tipoContribuyente: string): EnterpriseType {
        const clean = tipoContribuyente.toUpperCase();
        if (clean.includes('PERSONA NATURAL') || clean.includes('INDEPENDIENTE')) {
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
