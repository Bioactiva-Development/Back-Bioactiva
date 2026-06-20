/**
 * Filas denormalizadas (con los joins ya resueltos) listas para volcarse a las
 * hojas del Excel. Los valores de enum se mantienen crudos (string del enum) y la
 * capa de aplicación los traduce a etiquetas legibles antes de escribir.
 */

export interface OrgExportRow {
    codigoCliente: string;
    nombre: string;
    nombreComercial: string;
    ruc: string | null;
    tipo: string;
    tamano: string;
    sector: string | null;
    alianzasEstrategicas: string | null;
    actividadEconomica: string | null;
    ubicacion: string | null;
    linkedin: string | null;
    contactoActivoNombre: string | null;
    deletedAt: Date | null;
}

export interface ContactExportRow {
    id: number;
    vocativo: string | null;
    nombres: string;
    apellidos: string | null;
    correo: string;
    correo2: string | null;
    telefono: string | null;
    cargo: string | null;
    comentarios: string | null;
    estadoCorreo: string;
    orgNombreComercial: string;
    orgNombre: string;
    orgRuc: string | null;
    orgTamano: string;
    orgTipo: string;
    orgSector: string | null;
    orgUbicacion: string | null;
}

export interface LeadExportRow {
    id: number;
    estado: string;
    servicioInteres: string;
    comentarios: string | null;
    desafioOportunidad: string | null;
    /** Historial de contacto: registro de las actividades del lead (derivado). */
    historial: string | null;
    canalCaptacion: string | null;
    createdAt: Date;
    fechaCierre: Date | null;
    orgNombreComercial: string;
    orgRuc: string | null;
    orgTipo: string;
    orgSector: string | null;
    contactoNombre: string | null;
    contactoCorreo: string | null;
    encargadoNombre: string;
    proximaActividadNombre: string | null;
    proximaActividadFecha: Date | null;
    tieneAlertaActividad: boolean;
}

export interface CotizacionExportRow {
    id: number;
    idLead: number;
    fechaCot: Date;
    dirigido: string | null;
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

/**
 * Filtros de exportación. Los campos de enum (tipo/sector/tamano/estado) ya vienen
 * resueltos al valor canónico del enum (la capa de aplicación los normaliza desde
 * la etiqueta/valor recibido). Los campos de texto se aplican como "contiene"
 * (case-insensitive).
 */
export interface OrgExportFilters {
    nombre?: string;
    ruc?: string;
    sector?: string;
    tipo?: string;
    tamano?: string;
}

export interface ContactExportFilters {
    nombre?: string;
    correo?: string;
    organizacion?: string;
}

export interface LeadExportFilters {
    estado?: string;
    servicio?: string;
    organizacion?: string;
}

export interface CotizacionExportFilters {
    cliente?: string;
    servicio?: string;
    estado?: string;
}

export interface ICrmReadRepository {
    findOrganizations(opts: {
        includeDeleted: boolean;
        filters?: OrgExportFilters;
    }): Promise<OrgExportRow[]>;
    findContacts(opts?: {
        filters?: ContactExportFilters;
    }): Promise<ContactExportRow[]>;
    findLeads(opts?: { filters?: LeadExportFilters }): Promise<LeadExportRow[]>;
    findCotizaciones(opts?: {
        filters?: CotizacionExportFilters;
    }): Promise<CotizacionExportRow[]>;
}

export const CRM_READ_REPOSITORY = Symbol('CRM_READ_REPOSITORY');
