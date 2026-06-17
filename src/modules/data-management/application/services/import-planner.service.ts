import { Injectable } from '@nestjs/common';
import {
    ParsedRow,
    ParsedWorkbook,
} from '@/modules/data-management/domain/ports/excel-reader.port';
import { normalizeCell } from '@/modules/data-management/domain/constants/normalize';
import {
    resolveEnum,
    TIPO_EMPRESA_SYNONYMS,
    TAMANO_SYNONYMS,
    SECTOR_SYNONYMS,
    VOCATIVO_SYNONYMS,
    LEAD_STATE_SYNONYMS,
    TIPO_MONEDA_SYNONYMS,
    ESTADO_COT_SYNONYMS,
} from '@/modules/data-management/domain/constants/enum-synonyms';
import {
    ImportPlan,
    ImportValidation,
    RowIssue,
    OrgInput,
    ContactInput,
    LeadInput,
    CotizacionInput,
} from '@/modules/data-management/application/dto/import-types';

/** Nombres de hoja esperados (se buscan sin distinguir mayúsculas/acentos). */
const SHEET_ALIASES: Record<string, string[]> = {
    organizaciones: ['organizaciones', 'organizacion', 'orgs'],
    contactos: ['contactos', 'contacto', 'contacts'],
    leads: ['leads', 'lead'],
    cotizaciones: ['cotizaciones', 'cotizacion', 'cotizaciones', 'quotations'],
};

function str(row: ParsedRow, key: string): string | null {
    const v = row[key];
    if (v === null || v === undefined) {
        return null;
    }
    const s = String(v).trim();
    return s === '' ? null : s;
}

function digits(value: string | null): string | null {
    if (!value) {
        return null;
    }
    const d = value.replace(/\D/g, '');
    return d === '' ? null : d;
}

function dateVal(row: ParsedRow, key: string): Date | null {
    const v = row[key];
    if (v === null || v === undefined || v === '') {
        return null;
    }
    if (v instanceof Date) {
        return v;
    }
    const parsed = new Date(String(v));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Genera un código de cliente determinista a partir del nombre comercial y el
 * RUC (mezcla acordada con el cliente). La unicidad final se garantiza en el
 * repositorio (que añade sufijo ante colisión). Máx. 20 caracteres.
 */
export function generateCodigoCliente(
    nombreComercial: string,
    ruc: string | null,
): string {
    const slug =
        normalizeCell(nombreComercial)
            .replace(/[^a-z0-9]/g, '')
            .toUpperCase()
            .slice(0, 8) || 'ORG';
    const tail = ruc ? ruc.replace(/\D/g, '').slice(-6) : '';
    const code = tail ? `${slug}-${tail}` : slug;
    return code.slice(0, 20);
}

@Injectable()
export class ImportPlannerService {
    /** Parsea y valida el libro, construyendo un plan de inserción (sin tocar la BD). */
    plan(workbook: ParsedWorkbook): {
        plan: ImportPlan;
        validation: ImportValidation;
    } {
        const errors: RowIssue[] = [];
        const warnings: RowIssue[] = [];

        const orgSheet = this.findSheet(workbook, 'organizaciones');
        const contactSheet = this.findSheet(workbook, 'contactos');
        const leadSheet = this.findSheet(workbook, 'leads');
        const cotSheet = this.findSheet(workbook, 'cotizaciones');

        const organizaciones = this.planOrganizaciones(orgSheet, errors);
        const contactos = this.planContactos(contactSheet, errors);
        const leads = this.planLeads(leadSheet, errors, warnings);
        const cotizaciones = this.planCotizaciones(cotSheet, errors);

        const plan: ImportPlan = {
            organizaciones,
            contactos,
            leads,
            cotizaciones,
        };
        const validation: ImportValidation = {
            valid: errors.length === 0,
            errors,
            warnings,
            parsedCounts: {
                organizaciones: organizaciones.length,
                contactos: contactos.length,
                leads: leads.length,
                cotizaciones: cotizaciones.length,
            },
        };
        return { plan, validation };
    }

    private findSheet(
        workbook: ParsedWorkbook,
        canonical: string,
    ): ParsedRow[] {
        const aliases = SHEET_ALIASES[canonical];
        for (const [name, rows] of Object.entries(workbook)) {
            if (aliases.includes(normalizeCell(name))) {
                return rows;
            }
        }
        return [];
    }

    private rowNum(row: ParsedRow): number {
        return typeof row.__rowNumber === 'number' ? row.__rowNumber : 0;
    }

    private planOrganizaciones(
        rows: ParsedRow[],
        errors: RowIssue[],
    ): OrgInput[] {
        const out: OrgInput[] = [];
        for (const row of rows) {
            const rowNumber = this.rowNum(row);
            const nombreComercial = str(row, 'organizacion');
            const nombre = str(row, 'nombre completo');
            const tipoRaw = str(row, 'tipo de organizacion');
            const tamanoRaw = str(row, 'tamano');
            const sectorRaw = str(row, 'sector');

            const sheet = 'Organizaciones';
            // Fila sin contenido de negocio (solo "N°" u otra celda residual): se omite.
            if (!nombreComercial && !nombre && !str(row, 'ruc')) {
                continue;
            }
            if (!nombreComercial) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "Organización".',
                });
                continue;
            }
            if (!nombre) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "Nombre completo".',
                });
                continue;
            }
            const tipo = resolveEnum(TIPO_EMPRESA_SYNONYMS, tipoRaw);
            if (!tipo) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: `Tipo de organización no reconocido: "${tipoRaw ?? ''}".`,
                });
                continue;
            }
            const tamano = resolveEnum(TAMANO_SYNONYMS, tamanoRaw);
            if (!tamano) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: `Tamaño no reconocido: "${tamanoRaw ?? ''}".`,
                });
                continue;
            }
            let sector: string | null = null;
            if (sectorRaw) {
                const resolved = resolveEnum(SECTOR_SYNONYMS, sectorRaw);
                if (!resolved) {
                    errors.push({
                        sheet,
                        row: rowNumber,
                        message: `Sector no reconocido: "${sectorRaw}".`,
                    });
                    continue;
                }
                sector = resolved;
            }

            const ruc = digits(str(row, 'ruc'));
            out.push({
                rowNumber,
                codigoCliente: generateCodigoCliente(nombreComercial, ruc),
                nombre,
                nombreComercial,
                ruc,
                tipo,
                tamano,
                sector,
                alianzasEstrategicas: str(row, 'alianzas'),
                actividadEconomica: str(row, 'actividades'),
                ubicacion: str(row, 'departamento'),
                linkedin: str(row, 'linkedin'),
            });
        }
        return out;
    }

    private planContactos(
        rows: ParsedRow[],
        errors: RowIssue[],
    ): ContactInput[] {
        const out: ContactInput[] = [];
        for (const row of rows) {
            const rowNumber = this.rowNum(row);
            const sheet = 'Contactos';
            const nombres = str(row, 'nombre');
            const correo = str(row, 'correo electronico 1');
            // Fila residual sin datos de contacto: se omite.
            if (!nombres && !correo && !str(row, 'apellidos')) {
                continue;
            }
            if (!nombres) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "Nombre".',
                });
                continue;
            }
            if (!correo) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "Correo electrónico 1".',
                });
                continue;
            }
            const vocativoRaw = str(row, 'vocativo');
            let vocativo: string | null = null;
            if (vocativoRaw) {
                vocativo = resolveEnum(VOCATIVO_SYNONYMS, vocativoRaw) ?? null;
                if (!vocativo) {
                    errors.push({
                        sheet,
                        row: rowNumber,
                        message: `Vocativo no reconocido: "${vocativoRaw}".`,
                    });
                    continue;
                }
            }
            out.push({
                rowNumber,
                nombres,
                apellidos: str(row, 'apellidos'),
                vocativo,
                cargo: str(row, 'cargo'),
                correo,
                correo2: str(row, 'correo electronico 2'),
                telefono: str(row, 'telefono'),
                comentarios: str(row, 'comentarios'),
                orgRuc: digits(str(row, 'ruc')),
                orgNombreComercial: str(row, 'organizacion abreviado'),
            });
        }
        return out;
    }

    private planLeads(
        rows: ParsedRow[],
        errors: RowIssue[],
        warnings: RowIssue[],
    ): LeadInput[] {
        const out: LeadInput[] = [];
        for (const row of rows) {
            const rowNumber = this.rowNum(row);
            const sheet = 'Leads';
            const estadoRaw = str(row, 'estado');
            const servicio = str(row, 'servicio de interes');
            // Fila residual sin datos de lead: se omite.
            if (
                !estadoRaw &&
                !servicio &&
                !str(row, 'organizacion') &&
                !str(row, 'id lead')
            ) {
                continue;
            }
            if (!servicio) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "Servicio de interés".',
                });
                continue;
            }
            const estado = resolveEnum(LEAD_STATE_SYNONYMS, estadoRaw);
            if (!estado) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: `Estado de lead no reconocido: "${estadoRaw ?? ''}".`,
                });
                continue;
            }
            const encargadoNombre = str(row, 'encargado');
            if (!encargadoNombre) {
                warnings.push({
                    sheet,
                    row: rowNumber,
                    message:
                        'Sin "Encargado": se asignará al usuario que importa.',
                });
            }

            const proxNombre = str(row, 'proxima actividad');
            const actividad = proxNombre
                ? {
                      nombre: proxNombre,
                      fecha: dateVal(row, 'fecha de proxima actividad'),
                      tipo: 'OTRO', // sin columna de tipo en el Excel (acordado)
                  }
                : null;

            out.push({
                rowNumber,
                excelLeadId: str(row, 'id lead'),
                estado,
                servicioInteres: servicio,
                comentarios: str(row, 'comentarios'),
                desafioOportunidad: str(row, 'desafio u oportunidad'),
                canalCaptacion: str(row, 'canal de captacion'),
                createdAt: dateVal(row, 'fecha de creacion'),
                fechaCierre: dateVal(row, 'fecha de cierre'),
                orgRuc: digits(str(row, 'ruc // id contacto')),
                orgNombreComercial: str(row, 'organizacion'),
                contactoCorreo: str(row, 'correo electronico'),
                encargadoNombre,
                actividad,
            });
        }
        return out;
    }

    private planCotizaciones(
        rows: ParsedRow[],
        errors: RowIssue[],
    ): CotizacionInput[] {
        const out: CotizacionInput[] = [];
        for (const row of rows) {
            const rowNumber = this.rowNum(row);
            const sheet = 'Cotizaciones';
            const dirigido = str(row, 'dirigido a');
            const servicio = str(row, 'nombre del servicio');
            const montoRaw = str(row, 'monto');
            const monedaRaw = str(row, 'moneda');
            const estadoRaw = str(row, 'estado del proceso');
            const remitente = str(row, 'remitente');
            const excelLeadId = str(row, 'id de lead');

            // Fila residual sin datos de cotización: se omite.
            if (!excelLeadId && !dirigido && !servicio && !montoRaw) {
                continue;
            }
            if (!excelLeadId) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "ID de lead".',
                });
                continue;
            }
            if (!dirigido) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "Dirigido a".',
                });
                continue;
            }
            if (!servicio) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "Nombre del servicio".',
                });
                continue;
            }
            if (!remitente) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: 'Falta "Remitente".',
                });
                continue;
            }
            const monto = montoRaw
                ? montoRaw.replace(/[^\d.,]/g, '').replace(',', '.')
                : null;
            if (!monto || Number.isNaN(Number(monto))) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: `Monto inválido: "${montoRaw ?? ''}".`,
                });
                continue;
            }
            const tipo = resolveEnum(TIPO_MONEDA_SYNONYMS, monedaRaw);
            if (!tipo) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: `Moneda no reconocida: "${monedaRaw ?? ''}".`,
                });
                continue;
            }
            const estado = resolveEnum(ESTADO_COT_SYNONYMS, estadoRaw);
            if (!estado) {
                errors.push({
                    sheet,
                    row: rowNumber,
                    message: `Estado de cotización no reconocido: "${estadoRaw ?? ''}".`,
                });
                continue;
            }

            out.push({
                rowNumber,
                excelLeadId,
                fechaCot: dateVal(row, 'fecha de cotizacion'),
                dirigido,
                cliente: str(row, 'cliente'),
                producto: str(row, 'producto'),
                nombreServicio: servicio,
                monto,
                tipo,
                estado,
                nombreRemitente: remitente,
                observacion: str(row, 'observacion'),
                linkPropuesta: str(row, 'link de propuesta'),
            });
        }
        return out;
    }
}
