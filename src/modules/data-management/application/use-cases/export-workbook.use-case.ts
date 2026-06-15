import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    CRM_READ_REPOSITORY,
    type ICrmReadRepository,
} from '@/modules/data-management/domain/ports/crm-read.repository';
import {
    WORKBOOK_BUILDER,
    type IWorkbookBuilder,
    type SheetDefinition,
} from '@/modules/data-management/domain/ports/workbook-builder.port';
import {
    TIPO_EMPRESA_LABEL,
    TAMANO_LABEL,
    SECTOR_LABEL,
    VOCATIVO_LABEL,
    LEAD_STATE_LABEL,
    TIPO_MONEDA_LABEL,
    ESTADO_COT_LABEL,
    labelOf,
} from '@/modules/data-management/domain/constants/enum-labels';
import {
    resolveEnum,
    TIPO_EMPRESA_SYNONYMS,
    TAMANO_SYNONYMS,
    SECTOR_SYNONYMS,
    LEAD_STATE_SYNONYMS,
    ESTADO_COT_SYNONYMS,
} from '@/modules/data-management/domain/constants/enum-synonyms';

export type ExportTarget =
    | 'organizaciones'
    | 'contactos'
    | 'leads'
    | 'cotizaciones'
    | 'all';

export interface ExportOptions {
    /** Incluir organizaciones desactivadas (soft-delete) en la exportación. */
    includeDeleted: boolean;
    /** Filtros crudos por entidad (texto o etiqueta/valor de enum). */
    org?: {
        nombre?: string;
        ruc?: string;
        sector?: string;
        tipo?: string;
        tamano?: string;
    };
    contact?: { nombre?: string; correo?: string; organizacion?: string };
    lead?: { estado?: string; servicio?: string; organizacion?: string };
    cotizacion?: { cliente?: string; servicio?: string; estado?: string };
}

function fullName(
    nombres: string | null | undefined,
    apellidos: string | null | undefined,
): string {
    return [nombres, apellidos].filter(Boolean).join(' ').trim();
}

/**
 * Resuelve el valor de un filtro de enum aceptando tanto la etiqueta en español
 * ("Empresa nacional") como el valor del enum ("EMPRESA_NACIONAL"). Devuelve
 * `undefined` si no se reconoce (el filtro se ignora en vez de fallar).
 */
function resolveFilterEnum(
    synonyms: Record<string, string>,
    labelMap: Record<string, string>,
    raw: string | undefined,
): string | undefined {
    if (!raw) {
        return undefined;
    }
    const viaSyn = resolveEnum(synonyms, raw);
    if (viaSyn) {
        return viaSyn;
    }
    const upper = raw.trim().toUpperCase().replace(/\s+/g, '_');
    return upper in labelMap ? upper : undefined;
}

export class ExportWorkbookUseCase {
    constructor(
        @Inject(CRM_READ_REPOSITORY)
        private readonly readRepository: ICrmReadRepository,
        @Inject(WORKBOOK_BUILDER)
        private readonly workbookBuilder: IWorkbookBuilder,
    ) {}

    async execute(
        target: ExportTarget,
        options: ExportOptions,
    ): Promise<Buffer> {
        const sheets: SheetDefinition[] = [];

        if (target === 'organizaciones' || target === 'all') {
            sheets.push(await this.buildOrganizacionesSheet(options));
        }
        if (target === 'contactos' || target === 'all') {
            sheets.push(await this.buildContactosSheet(options));
        }
        if (target === 'leads' || target === 'all') {
            sheets.push(await this.buildLeadsSheet(options));
        }
        if (target === 'cotizaciones' || target === 'all') {
            sheets.push(await this.buildCotizacionesSheet(options));
        }

        return this.workbookBuilder.build(sheets);
    }

    private async buildOrganizacionesSheet(
        options: ExportOptions,
    ): Promise<SheetDefinition> {
        const orgs = await this.readRepository.findOrganizations({
            includeDeleted: options.includeDeleted,
            filters: {
                nombre: options.org?.nombre,
                ruc: options.org?.ruc,
                tipo: resolveFilterEnum(
                    TIPO_EMPRESA_SYNONYMS,
                    TIPO_EMPRESA_LABEL,
                    options.org?.tipo,
                ),
                sector: resolveFilterEnum(
                    SECTOR_SYNONYMS,
                    SECTOR_LABEL,
                    options.org?.sector,
                ),
                tamano: resolveFilterEnum(
                    TAMANO_SYNONYMS,
                    TAMANO_LABEL,
                    options.org?.tamano,
                ),
            },
        });

        return {
            name: 'Organizaciones',
            columns: [
                { header: 'N°', key: 'n', width: 6 },
                { header: 'Organización', key: 'organizacion', width: 28 },
                { header: 'Nombre completo', key: 'nombreCompleto', width: 36 },
                { header: 'RUC', key: 'ruc', width: 14 },
                { header: 'Contacto vigente', key: 'contactoVigente', width: 26 },
                { header: 'Tipo de organización', key: 'tipo', width: 22 },
                { header: 'Tamaño', key: 'tamano', width: 12 },
                { header: 'Sector', key: 'sector', width: 18 },
                { header: 'Alianzas', key: 'alianzas', width: 30 },
                { header: 'Actividades', key: 'actividades', width: 36 },
                { header: 'Departamento', key: 'departamento', width: 16 },
                { header: 'LinkedIn', key: 'linkedin', width: 30 },
                { header: 'Estado', key: 'estado', width: 14 },
            ],
            rows: orgs.map((o, i) => ({
                n: i + 1,
                organizacion: o.nombreComercial,
                nombreCompleto: o.nombre,
                ruc: o.ruc ?? '',
                contactoVigente: o.contactoActivoNombre ?? '',
                tipo: labelOf(TIPO_EMPRESA_LABEL, o.tipo),
                tamano: labelOf(TAMANO_LABEL, o.tamano),
                sector: labelOf(SECTOR_LABEL, o.sector),
                alianzas: o.alianzasEstrategicas ?? '',
                actividades: o.actividadEconomica ?? '',
                departamento: o.ubicacion ?? '',
                linkedin: o.linkedin ?? '',
                estado: o.deletedAt ? 'No vigente' : 'Vigente',
                __deleted: o.deletedAt !== null,
            })),
            highlightWhen: (row) => row.__deleted === true,
        };
    }

    private async buildContactosSheet(
        options: ExportOptions,
    ): Promise<SheetDefinition> {
        const contacts = await this.readRepository.findContacts({
            filters: {
                nombre: options.contact?.nombre,
                correo: options.contact?.correo,
                organizacion: options.contact?.organizacion,
            },
        });

        return {
            name: 'Contactos',
            columns: [
                { header: 'N°', key: 'n', width: 6 },
                { header: 'Código individual', key: 'codigo', width: 16 },
                { header: 'Vocativo', key: 'vocativo', width: 10 },
                { header: 'Nombre', key: 'nombre', width: 18 },
                { header: 'Apellidos', key: 'apellidos', width: 20 },
                { header: 'Nombres y apellidos', key: 'nombreCompleto', width: 30 },
                { header: 'Organización abreviado', key: 'orgAbrev', width: 26 },
                { header: 'Organización extendido', key: 'orgExt', width: 36 },
                { header: 'RUC', key: 'ruc', width: 14 },
                { header: 'Tamaño de la organización', key: 'orgTamano', width: 16 },
                { header: 'Tipo de organización', key: 'orgTipo', width: 22 },
                { header: 'Sector', key: 'orgSector', width: 18 },
                { header: 'Ubicación', key: 'ubicacion', width: 16 },
                { header: 'Correo electrónico 1', key: 'correo', width: 30 },
                { header: 'Correo electrónico 2', key: 'correo2', width: 30 },
                { header: 'Teléfono', key: 'telefono', width: 16 },
                { header: 'Cargo', key: 'cargo', width: 24 },
                { header: 'Comentarios', key: 'comentarios', width: 30 },
            ],
            rows: contacts.map((c, i) => ({
                n: i + 1,
                codigo: c.id,
                vocativo: labelOf(VOCATIVO_LABEL, c.vocativo),
                nombre: c.nombres,
                apellidos: c.apellidos ?? '',
                nombreCompleto: fullName(c.nombres, c.apellidos),
                orgAbrev: c.orgNombreComercial,
                orgExt: c.orgNombre,
                ruc: c.orgRuc ?? '',
                orgTamano: labelOf(TAMANO_LABEL, c.orgTamano),
                orgTipo: labelOf(TIPO_EMPRESA_LABEL, c.orgTipo),
                orgSector: labelOf(SECTOR_LABEL, c.orgSector),
                ubicacion: c.orgUbicacion ?? '',
                correo: c.correo,
                correo2: c.correo2 ?? '',
                telefono: c.telefono ?? '',
                cargo: c.cargo ?? '',
                comentarios: c.comentarios ?? '',
                __vencido: c.estadoCorreo === 'VENCIDO',
            })),
            highlightWhen: (row) => row.__vencido === true,
        };
    }

    private async buildLeadsSheet(
        options: ExportOptions,
    ): Promise<SheetDefinition> {
        const leads = await this.readRepository.findLeads({
            filters: {
                estado: resolveFilterEnum(
                    LEAD_STATE_SYNONYMS,
                    LEAD_STATE_LABEL,
                    options.lead?.estado,
                ),
                servicio: options.lead?.servicio,
                organizacion: options.lead?.organizacion,
            },
        });

        return {
            name: 'Leads',
            columns: [
                { header: 'N°', key: 'n', width: 6 },
                { header: 'Año', key: 'anio', width: 8 },
                { header: 'ID Lead', key: 'idLead', width: 10 },
                { header: 'RUC // ID Contacto', key: 'rucContacto', width: 18 },
                { header: 'Organización', key: 'organizacion', width: 28 },
                { header: 'Tipo', key: 'tipo', width: 20 },
                { header: 'Sector', key: 'sector', width: 18 },
                { header: 'Nombre del contacto', key: 'contacto', width: 26 },
                { header: 'Correo electrónico', key: 'correo', width: 30 },
                { header: 'Estado', key: 'estado', width: 16 },
                { header: 'Fecha de creación', key: 'fechaCreacion', width: 18 },
                { header: 'Servicio de interés', key: 'servicio', width: 28 },
                { header: 'Comentarios', key: 'comentarios', width: 30 },
                { header: 'Desafío u oportunidad', key: 'desafio', width: 30 },
                { header: 'Historial de contacto', key: 'historial', width: 30 },
                { header: 'Encargado', key: 'encargado', width: 24 },
                { header: 'Canal de captación', key: 'canal', width: 20 },
                { header: 'Próxima actividad', key: 'proxActividad', width: 28 },
                {
                    header: 'Fecha de próxima actividad',
                    key: 'proxFecha',
                    width: 20,
                },
                { header: 'Alerta actividad', key: 'alerta', width: 14 },
                { header: 'Fecha de Cierre', key: 'fechaCierre', width: 18 },
            ],
            rows: leads.map((l, i) => ({
                n: i + 1,
                anio: l.createdAt.getFullYear(),
                idLead: l.id,
                rucContacto: l.orgRuc ?? '',
                organizacion: l.orgNombreComercial,
                tipo: labelOf(TIPO_EMPRESA_LABEL, l.orgTipo),
                sector: labelOf(SECTOR_LABEL, l.orgSector),
                contacto: l.contactoNombre ?? '',
                correo: l.contactoCorreo ?? '',
                estado: labelOf(LEAD_STATE_LABEL, l.estado),
                fechaCreacion: l.createdAt,
                servicio: l.servicioInteres,
                comentarios: l.comentarios ?? '',
                desafio: l.desafioOportunidad ?? '',
                historial: l.notasContacto ?? '',
                encargado: l.encargadoNombre,
                canal: l.canalCaptacion ?? '',
                proxActividad: l.proximaActividadNombre ?? '',
                proxFecha: l.proximaActividadFecha ?? '',
                alerta: l.tieneAlertaActividad ? 'Sí' : 'No',
                fechaCierre: l.fechaCierre ?? '',
                __alerta: l.tieneAlertaActividad,
            })),
            highlightWhen: (row) => row.__alerta === true,
        };
    }

    private async buildCotizacionesSheet(
        options: ExportOptions,
    ): Promise<SheetDefinition> {
        const cotizaciones = await this.readRepository.findCotizaciones({
            filters: {
                cliente: options.cotizacion?.cliente,
                servicio: options.cotizacion?.servicio,
                estado: resolveFilterEnum(
                    ESTADO_COT_SYNONYMS,
                    ESTADO_COT_LABEL,
                    options.cotizacion?.estado,
                ),
            },
        });

        return {
            name: 'Cotizaciones',
            columns: [
                { header: 'N°', key: 'n', width: 6 },
                { header: 'Año', key: 'anio', width: 8 },
                { header: 'Mes', key: 'mes', width: 8 },
                { header: 'ID de lead', key: 'idLead', width: 12 },
                { header: '# Cotización', key: 'numero', width: 12 },
                { header: 'Dirigido a', key: 'dirigido', width: 24 },
                { header: 'Fecha de cotización', key: 'fecha', width: 18 },
                { header: 'Cliente', key: 'cliente', width: 24 },
                { header: 'Producto', key: 'producto', width: 24 },
                { header: 'Nombre del servicio', key: 'servicio', width: 28 },
                { header: 'Monto', key: 'monto', width: 14 },
                { header: 'Moneda', key: 'moneda', width: 10 },
                { header: 'Estado del proceso', key: 'estado', width: 18 },
                { header: 'Remitente', key: 'remitente', width: 24 },
                { header: 'Observación', key: 'observacion', width: 30 },
                { header: 'Link de propuesta', key: 'link', width: 30 },
            ],
            rows: cotizaciones.map((c, i) => ({
                n: i + 1,
                anio: c.fechaCot.getFullYear(),
                mes: c.fechaCot.getMonth() + 1,
                idLead: c.idLead,
                numero: c.id,
                dirigido: c.dirigido,
                fecha: c.fechaCot,
                cliente: c.cliente ?? '',
                producto: c.producto ?? '',
                servicio: c.nombreServicio,
                monto: c.monto,
                moneda: labelOf(TIPO_MONEDA_LABEL, c.tipo),
                estado: labelOf(ESTADO_COT_LABEL, c.estado),
                remitente: c.nombreRemitente,
                observacion: c.observacion ?? '',
                link: c.linkPropuesta ?? '',
            })),
        };
    }
}
