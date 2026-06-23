/** Estructuras intermedias del proceso de importación (insert-only). */

export interface OrgInput {
    rowNumber: number;
    codigoCliente: string;
    nombre: string;
    nombreComercial: string;
    ruc: string | null;
    tipo: string;
    tamano: string;
    sector: string;
    subArea: string | null;
    alianzasEstrategicas: string | null;
    actividadEconomica: string | null;
    ubicacion: string | null;
    linkedin: string | null;
}

export interface ContactInput {
    rowNumber: number;
    nombres: string;
    apellidos: string | null;
    vocativo: string | null;
    cargo: string | null;
    correo: string;
    correo2: string | null;
    telefono: string | null;
    comentarios: string | null;
    /** Clave natural para resolver la organización (RUC o nombre comercial). */
    orgRuc: string | null;
    orgNombreComercial: string | null;
}

export interface ActividadInput {
    nombre: string;
    fecha: Date | null;
    tipo: string;
}

export interface LeadInput {
    rowNumber: number;
    /** "ID Lead" del Excel: clave para que las cotizaciones referencien el lead. */
    excelLeadId: string | null;
    estado: string;
    servicioInteres: string;
    comentarios: string | null;
    desafioOportunidad: string | null;
    canalCaptacion: string | null;
    createdAt: Date | null;
    fechaCierre: Date | null;
    orgRuc: string | null;
    orgNombreComercial: string | null;
    contactoCorreo: string | null;
    encargadoNombre: string | null;
    actividad: ActividadInput | null;
}

export interface CotizacionInput {
    rowNumber: number;
    excelLeadId: string | null;
    fechaCot: Date | null;
    dirigido: string;
    cliente: string | null;
    producto: string | null;
    nombreServicio: string;
    monto: string;
    tipo: string;
    estado: string;
    nombreRemitente: string;
    observacion: string | null;
    linkPropuesta: string | null;
}

export interface ImportPlan {
    organizaciones: OrgInput[];
    contactos: ContactInput[];
    leads: LeadInput[];
    cotizaciones: CotizacionInput[];
}

export interface RowIssue {
    sheet: string;
    row: number;
    message: string;
}

export interface ImportValidation {
    valid: boolean;
    /** Errores que bloquean la fila (no se insertará). */
    errors: RowIssue[];
    /** Avisos no bloqueantes (p. ej. encargado inexistente → se asigna al importador). */
    warnings: RowIssue[];
    parsedCounts: {
        organizaciones: number;
        contactos: number;
        leads: number;
        cotizaciones: number;
    };
}

export interface ImportSummary {
    inserted: {
        organizaciones: number;
        contactos: number;
        leads: number;
        actividades: number;
        cotizaciones: number;
    };
    /** Filas omitidas por duplicado (insert-only) o por error de resolución. */
    skipped: RowIssue[];
    warnings: RowIssue[];
}
