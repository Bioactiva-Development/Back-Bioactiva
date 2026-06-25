import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
import {
    WORKBOOK_BUILDER,
    type IWorkbookBuilder,
    type SheetColumn,
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
} from '@/modules/data-management/domain/constants/enum-labels';
import {
    CRM_READ_REPOSITORY,
    type ICrmReadRepository,
} from '@/modules/data-management/domain/ports/crm-read.repository';

/** Atajo para declarar una columna de la plantilla con sus ayudas. */
function col(
    header: string,
    opts: Omit<SheetColumn, 'header' | 'key'> = {},
): SheetColumn {
    return { header, key: header, width: opts.width ?? 24, ...opts };
}

export class GenerateTemplateUseCase {
    constructor(
        @Inject(WORKBOOK_BUILDER)
        private readonly workbookBuilder: IWorkbookBuilder,
        @Inject(CRM_READ_REPOSITORY)
        private readonly crmRead: ICrmReadRepository,
    ) {}

    async execute(): Promise<Buffer> {
        const activeUsers = await this.crmRead.findActiveUsers();

        const sheets: SheetDefinition[] = [
            this.buildInstructionsSheet(),
            this.buildOrganizacionesSheet(),
            this.buildContactosSheet(),
            this.buildLeadsSheet(activeUsers),
            this.buildCotizacionesSheet(),
            this.buildReferenceSheet(),
        ];

        return this.workbookBuilder.build(sheets);
    }

    private buildOrganizacionesSheet(): SheetDefinition {
        return {
            name: 'Organizaciones',
            columns: [
                col('N°', { width: 6, note: 'Opcional: numeración libre.' }),
                col('Organización', {
                    required: true,
                    note: 'Obligatorio. Nombre comercial (ej: Bioactiva). Sirve para vincular contactos y leads cuando no hay RUC.',
                }),
                col('Nombre completo', {
                    required: true,
                    note: 'Obligatorio. Razón social completa (ej: Bioactiva Perú S.A.C.).',
                }),
                col('RUC', {
                    note: 'Opcional. 11 dígitos (ej: 20123456789). Si lo tienes, es la forma más segura de vincular contactos y leads; si no, se vinculan por el nombre de la organización.',
                }),
                col('Sub área', {
                    note: 'Opcional. Área o sub-área específica de la organización.',
                }),
                col('Tipo de organización', {
                    required: true,
                    dropdown: Object.values(TIPO_EMPRESA_LABEL),
                    note: 'Obligatorio. Elige de la lista.',
                }),
                col('Tamaño', {
                    required: true,
                    dropdown: Object.values(TAMANO_LABEL),
                    note: 'Obligatorio. Elige de la lista.',
                }),
                col('Sector', {
                    required: true,
                    dropdown: Object.values(SECTOR_LABEL),
                    note: 'Obligatorio. Elige de la lista. Si no aplica, usa "Otros".',
                }),
                col('Alianzas'),
                col('Actividades'),
                col('Departamento', {
                    note: 'Opcional. Ubicación (ej: Lima).',
                }),
                col('LinkedIn'),
            ],
            rows: [],
        };
    }

    private buildContactosSheet(): SheetDefinition {
        return {
            name: 'Contactos',
            columns: [
                col('N°', { width: 6, note: 'Opcional: numeración libre.' }),
                col('Vocativo', {
                    dropdown: Object.values(VOCATIVO_LABEL),
                    note: 'Opcional. Elige de la lista.',
                }),
                col('Nombre', {
                    required: true,
                    note: 'Obligatorio. Nombres del contacto.',
                }),
                col('Apellidos'),
                col('Organización', {
                    required: true,
                    dropdownFormula: 'Organizaciones!$B$2:$B$301',
                    note: 'Obligatorio. Selecciona de la lista (los nombres comerciales de la hoja Organizaciones). La organización debe existir en esa hoja o en el CRM.',
                }),
                col('Correo electrónico 1', {
                    required: true,
                    note: 'Obligatorio. Es la clave única del contacto: si ya existe ese correo, la fila se omite.',
                }),
                col('Correo electrónico 2'),
                col('Teléfono', {
                    note: 'Opcional. Formato internacional: empieza con + y el código de país, seguido del número (ej: +51987654321).',
                }),
                col('Cargo'),
                col('Comentarios'),
            ],
            rows: [],
        };
    }

    private buildLeadsSheet(activeUsers: string[]): SheetDefinition {
        return {
            name: 'Leads',
            columns: [
                col('N°', { width: 6, note: 'Opcional: numeración libre.' }),
                col('ID Lead', {
                    note: 'Identificador referencial que TÚ asignas (ej: L-001). Se usa para vincular cotizaciones: repítelo en la hoja Cotizaciones, columna "ID de lead". No se guarda en el CRM.',
                }),
                col('Organización', {
                    required: true,
                    dropdownFormula: 'Organizaciones!$B$2:$B$301',
                    note: 'Obligatorio. Selecciona el nombre comercial de la lista (hoja Organizaciones). La organización debe estar en esa hoja o existir en el CRM.',
                }),
                col('Contacto', {
                    dropdownFormula: 'Contactos!$F$2:$F$301',
                    note: 'Opcional. Selecciona el correo del contacto vinculado a este lead (hoja Contactos). Debe pertenecer a la organización del lead.',
                }),
                col('Estado', {
                    required: true,
                    dropdown: Object.values(LEAD_STATE_LABEL),
                    note: 'Obligatorio. Elige de la lista.',
                }),
                col('Fecha de creación', {
                    note: 'Opcional. Formato AAAA-MM-DD (ej: 2026-01-15). Si se omite, se usa la fecha de importación.',
                }),
                col('Servicio de interés', {
                    required: true,
                    note: 'Obligatorio. Servicio o producto que interesa al lead.',
                }),
                col('Comentarios'),
                col('Desafío u oportunidad'),
                col('Encargado', {
                    ...(activeUsers.length > 0
                        ? {
                              dropdown: activeUsers,
                              note: 'Selecciona de la lista (usuarios activos en el CRM). Si no coincide, el lead se te asigna a ti.',
                          }
                        : {
                              note: 'Nombre y apellido tal como aparece en el CRM. Si no coincide, el lead se te asigna a ti.',
                          }),
                }),
                col('Canal de captación'),
            ],
            rows: [],
        };
    }

    private buildCotizacionesSheet(): SheetDefinition {
        return {
            name: 'Cotizaciones',
            columns: [
                col('N°', { width: 6, note: 'Opcional: numeración libre.' }),
                col('ID de lead', {
                    required: true,
                    dropdownFormula: 'Leads!$B$2:$B$301',
                    note: 'Obligatorio. Selecciona de la lista el ID Lead de la hoja Leads. Si no coincide con ningún lead del archivo, la cotización se omite.',
                }),
                col('Fecha de cotización', {
                    required: true,
                    note: 'Obligatorio. Formato AAAA-MM-DD (ej: 2026-01-15).',
                }),
                col('Producto'),
                col('Nombre del servicio', {
                    required: true,
                    note: 'Obligatorio.',
                }),
                col('Monto', {
                    required: true,
                    note: 'Obligatorio. Solo números (ej: 15000.50). No incluyas el símbolo de moneda.',
                }),
                col('Moneda', {
                    required: true,
                    dropdown: Object.values(TIPO_MONEDA_LABEL),
                    note: 'Obligatorio. Elige de la lista (PEN o USD). También se acepta "soles" o "dólares".',
                }),
                col('Estado del proceso', {
                    required: true,
                    dropdown: Object.values(ESTADO_COT_LABEL),
                    note: 'Obligatorio. Elige de la lista.',
                }),
                col('Observación'),
                col('Link de propuesta'),
            ],
            rows: [],
        };
    }

    private buildInstructionsSheet(): SheetDefinition {
        const pasos = [
            'CÓMO LLENAR ESTA PLANTILLA',
            '',
            '1. Completa las hojas Organizaciones, Contactos, Leads y Cotizaciones en ese orden. No cambies los nombres de las columnas ni el orden de las hojas.',
            '2. Las columnas con el encabezado resaltado en AZUL son OBLIGATORIAS.',
            '3. En las columnas con lista desplegable, elige un valor. También se aceptan equivalentes (p. ej. "soles" = PEN, "En proceso" = estado del lead).',
            '4. Pasa el cursor sobre cada encabezado (esquina con triángulo rojo) para ver la ayuda y ejemplos.',
            '',
            'CONTACTOS',
            '· Organización es OBLIGATORIA. Selecciona de la lista (nombre comercial de la hoja Organizaciones).',
            '· Teléfono: formato internacional (ej: +51987654321). Debe iniciar con + seguido del código de país.',
            '· Correo electrónico 1 es la clave única: si ya existe en el CRM, el contacto se omite.',
            '',
            'LEADS',
            '· ID Lead es solo referencial para vincular cotizaciones; repítelo en la hoja Cotizaciones, columna "ID de lead". No se guarda en el CRM.',
            '· Organización es OBLIGATORIA. Selecciona de la lista de la hoja Organizaciones.',
            '· Contacto (opcional): selecciona el correo de la lista de la hoja Contactos.',
            '· El estado del lead determina cuántas cotizaciones puede tener:',
            '    - EN_PROSPECTO: sin cotizaciones.',
            '    - OFERTADO: exactamente 1 cotización (PENDIENTE o ENVIADA). Si no la agregas, se crea una automáticamente.',
            '    - CIERRE_CON_VENTA: exactamente 1 cotización en ACEPTADA.',
            '    - CIERRE_SIN_VENTA: exactamente 1 cotización en RECHAZADA.',
            '',
            'COTIZACIONES',
            '· ID de lead es OBLIGATORIO y debe coincidir con el "ID Lead" de la hoja Leads del mismo archivo.',
            '· Fecha de cotización es OBLIGATORIA. Formato AAAA-MM-DD (ej: 2026-01-15).',
            '· Cliente, Dirigido a y Remitente se derivan automáticamente del lead vinculado (organización, contacto y encargado); no los incluyas como columnas.',
            '',
            'GENERAL',
            '· Fechas en formato AAAA-MM-DD (ej: 2026-01-15). Montos solo con números (ej: 15000.50).',
            '· Usa "Validar" primero para revisar errores antes de "Importar".',
            '· La importación solo AGREGA registros nuevos; los duplicados se omiten sin modificar los existentes.',
            '· Consulta la hoja "Valores válidos" para ver todas las opciones de cada campo.',
        ];
        return {
            name: 'Instrucciones',
            columns: [
                { header: 'Instrucciones de importación', key: 'texto', width: 120 },
            ],
            rows: pasos.map((texto) => ({ texto })),
        };
    }

    private buildReferenceSheet(): SheetDefinition {
        const groups: { campo: string; valores: string }[] = [
            {
                campo: 'Tipo de organización',
                valores: Object.values(TIPO_EMPRESA_LABEL).join(', '),
            },
            {
                campo: 'Tamaño',
                valores: Object.values(TAMANO_LABEL).join(', '),
            },
            {
                campo: 'Sector',
                valores: Object.values(SECTOR_LABEL).join(', '),
            },
            {
                campo: 'Vocativo',
                valores: Object.values(VOCATIVO_LABEL).join(', '),
            },
            {
                campo: 'Estado de lead',
                valores: Object.values(LEAD_STATE_LABEL).join(', '),
            },
            {
                campo: 'Moneda',
                valores: Object.values(TIPO_MONEDA_LABEL).join(', '),
            },
            {
                campo: 'Estado de cotización',
                valores: Object.values(ESTADO_COT_LABEL).join(', '),
            },
        ];
        return {
            name: 'Valores válidos',
            columns: [
                { header: 'Campo', key: 'campo', width: 26 },
                { header: 'Valores aceptados', key: 'valores', width: 90 },
            ],
            rows: groups,
        };
    }
}
