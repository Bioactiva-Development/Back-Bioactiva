import { Inject } from '@/shared/infrastructure/dependency-inyection/inyect';
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
} from '@/modules/data-management/domain/constants/enum-labels';

function emptySheet(name: string, headers: string[]): SheetDefinition {
    return {
        name,
        columns: headers.map((h) => ({ header: h, key: h, width: 22 })),
        rows: [],
    };
}

export class GenerateTemplateUseCase {
    constructor(
        @Inject(WORKBOOK_BUILDER)
        private readonly workbookBuilder: IWorkbookBuilder,
    ) {}

    async execute(): Promise<Buffer> {
        const sheets: SheetDefinition[] = [
            emptySheet('Organizaciones', [
                'N°',
                'Organización',
                'Nombre completo',
                'RUC',
                'Contacto vigente',
                'Tipo de organización',
                'Tamaño',
                'Sector',
                'Alianzas',
                'Actividades',
                'Departamento',
                'LinkedIn',
            ]),
            emptySheet('Contactos', [
                'N°',
                'Código individual',
                'Vocativo',
                'Nombre',
                'Apellidos',
                'Nombres y apellidos',
                'Organización abreviado',
                'Organización extendido',
                'RUC',
                'Tamaño de la organización',
                'Tipo de organización',
                'Sector',
                'Ubicación',
                'Correo electrónico 1',
                'Correo electrónico 2',
                'Teléfono',
                'Cargo',
                'Comentarios',
            ]),
            emptySheet('Leads', [
                'N°',
                'Año',
                'ID Lead',
                'RUC // ID Contacto',
                'Organización',
                'Tipo',
                'Sector',
                'Nombre del contacto',
                'Correo electrónico',
                'Estado',
                'Fecha de creación',
                'Servicio de interés',
                'Comentarios',
                'Desafío u oportunidad',
                'Historial de contacto',
                'Encargado',
                'Canal de captación',
                'Próxima actividad',
                'Fecha de próxima actividad',
                'Alerta actividad',
                'Fecha de Cierre',
            ]),
            emptySheet('Cotizaciones', [
                'N°',
                'Año',
                'Mes',
                'ID de lead',
                '# Cotización',
                'Dirigido a',
                'Fecha de cotización',
                'Cliente',
                'Producto',
                'Nombre del servicio',
                'Monto',
                'Moneda',
                'Estado del proceso',
                'Remitente',
                'Observación',
                'Link de propuesta',
            ]),
            this.buildReferenceSheet(),
        ];

        return this.workbookBuilder.build(sheets);
    }

    private buildReferenceSheet(): SheetDefinition {
        const groups: { campo: string; valores: string }[] = [
            {
                campo: 'Tipo de organización',
                valores: Object.values(TIPO_EMPRESA_LABEL).join(', '),
            },
            { campo: 'Tamaño', valores: Object.values(TAMANO_LABEL).join(', ') },
            { campo: 'Sector', valores: Object.values(SECTOR_LABEL).join(', ') },
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
