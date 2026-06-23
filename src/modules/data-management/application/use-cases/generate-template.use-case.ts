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
    ) {}

    async execute(): Promise<Buffer> {
        const sheets: SheetDefinition[] = [
            this.buildInstructionsSheet(),
            this.buildOrganizacionesSheet(),
            this.buildContactosSheet(),
            this.buildLeadsSheet(),
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
                col('Organización abreviado', {
                    dropdownFormula: 'Organizaciones!$B$2:$B$301',
                    note: 'Selecciona de la lista (se autocompleta con lo que hayas llenado en la hoja Organizaciones). También puedes escribir el nombre comercial o la razón social directamente.',
                }),
                col('RUC', {
                    note: 'Opcional. Vincula el contacto por RUC si la organización lo tiene; si no, se usa el nombre de la organización. La organización debe estar en la hoja Organizaciones o ya existir en el CRM.',
                }),
                col('Correo electrónico 1', {
                    required: true,
                    note: 'Obligatorio. Es la clave única del contacto: si ya existe ese correo, la fila se omite.',
                }),
                col('Correo electrónico 2'),
                col('Teléfono'),
                col('Cargo'),
                col('Comentarios'),
            ],
            rows: [],
        };
    }

    private buildLeadsSheet(): SheetDefinition {
        return {
            name: 'Leads',
            columns: [
                col('N°', { width: 6, note: 'Opcional: numeración libre.' }),
                col('ID Lead', {
                    note: 'Identificador que TÚ asignas a este lead (ej: L-001). Repítelo en la hoja Cotizaciones, columna "ID de lead", para vincular sus cotizaciones.',
                }),
                col('RUC // ID Contacto', {
                    note: 'Opcional. RUC de la organización del lead (ej: 20123456789). Sirve para vincularlo con la hoja Organizaciones. Si no hay RUC, el vínculo se hace por la columna "Organización".',
                }),
                col('Organización', {
                    dropdownFormula: 'Organizaciones!$B$2:$B$301',
                    note: 'Selecciona de la lista (se autocompleta con lo que hayas llenado en la hoja Organizaciones). También puedes escribir el nombre comercial o la razón social directamente.',
                }),
                col('Correo electrónico', {
                    dropdownFormula: 'Contactos!$G$2:$G$301',
                    note: 'Selecciona de la lista (se autocompleta con los correos de la hoja Contactos). El contacto debe existir en esa hoja para vincularse.',
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
                    note: 'Nombre y apellido tal como aparece en el CRM. Si no coincide, el lead se te asigna a ti.',
                }),
                col('Canal de captación'),
                col('Próxima actividad', {
                    note: 'Opcional. Si lo llenas, se crea una actividad pendiente para el lead.',
                }),
                col('Fecha de próxima actividad', {
                    note: 'Formato AAAA-MM-DD (ej: 2026-01-20).',
                }),
                col('Fecha de Cierre', {
                    note: 'Opcional. Formato AAAA-MM-DD (ej: 2026-02-10).',
                }),
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
                    note: 'Obligatorio. Selecciona de la lista (se autocompleta con los IDs de la hoja Leads). Si no coincide con ningún ID Lead, la cotización se omite.',
                }),
                col('Dirigido a', {
                    required: true,
                    note: 'Obligatorio. Persona o área a la que se dirige la cotización.',
                }),
                col('Fecha de cotización', {
                    note: 'Opcional. Formato AAAA-MM-DD (ej: 2026-01-15).',
                }),
                col('Cliente'),
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
                col('Remitente', {
                    required: true,
                    note: 'Obligatorio. Nombre de quien envía la cotización.',
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
            '1. Completa las hojas Organizaciones, Contactos, Leads y Cotizaciones. No cambies los nombres de las columnas ni el orden de las hojas.',
            '2. Las columnas con el encabezado resaltado en AZUL son OBLIGATORIAS.',
            '3. En las columnas con lista desplegable, elige un valor. También se aceptan equivalentes (p. ej. "soles" = PEN, "En proceso" = estado del lead).',
            '4. Pasa el cursor sobre cada encabezado (esquina con triángulo rojo) para ver la ayuda y ejemplos.',
            '5. VINCULAR COTIZACIONES CON LEADS: el valor de "ID de lead" (hoja Cotizaciones) debe ser igual al de "ID Lead" (hoja Leads). Si no coinciden, la cotización no se importa.',
            '6. VINCULAR ORGANIZACIÓN: contactos y leads se asocian a su organización por RUC (si lo tiene) o por el nombre de la organización. El RUC es OPCIONAL: si no lo tienes, basta el nombre, que puede ser el nombre comercial ("Organización") o la razón social ("Nombre completo"). La organización debe estar en la hoja Organizaciones o ya existir en el CRM.',
            '7. Fechas en formato AAAA-MM-DD (ej: 2026-01-15). Montos solo con números (ej: 15000.50).',
            '8. En el CRM, primero usa "Validar" para revisar errores y luego "Importar".',
            '',
            'IMPORTANTE: la importación solo AGREGA registros nuevos. Los duplicados (mismo RUC, mismo correo o misma organización) se omiten automáticamente; no se actualizan datos existentes.',
            'Consulta la hoja "Valores válidos" para ver todas las opciones aceptadas de cada campo.',
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
