import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
    ExportWorkbookUseCase,
    ExportOptions,
} from '@/modules/data-management/application/use-cases/export-workbook.use-case';
import {
    OrgExportRow,
    ContactExportRow,
    LeadExportRow,
    CotizacionExportRow,
} from '@/modules/data-management/domain/ports/crm-read.repository';
import { SheetDefinition } from '@/modules/data-management/domain/ports/workbook-builder.port';

describe('Data management module', () => {
    describe('ExportWorkbookUseCase', () => {
        let useCase: ExportWorkbookUseCase;
        let readRepository: any;
        let workbookBuilder: any;

        const orgRow = (over: Partial<OrgExportRow> = {}): OrgExportRow => ({
            codigoCliente: 'ORG-1',
            nombre: 'Organización Completa S.A.',
            nombreComercial: 'OrgComercial',
            ruc: '20404057805',
            tipo: 'EMPRESA_NACIONAL',
            tamano: 'GRANDE',
            sector: 'AGRICOLA',
            alianzasEstrategicas: 'Alianza X',
            actividadEconomica: 'Actividad Y',
            ubicacion: 'Lima',
            linkedin: 'https://linkedin.com/org',
            contactoActivoNombre: 'Juan Perez',
            deletedAt: null,
            ...over,
        });

        const contactRow = (
            over: Partial<ContactExportRow> = {},
        ): ContactExportRow => ({
            id: 7,
            vocativo: 'SR',
            nombres: 'Juan',
            apellidos: 'Perez',
            correo: 'juan@x.com',
            correo2: 'juan2@x.com',
            telefono: '999',
            cargo: 'CEO',
            comentarios: 'comentario',
            estadoCorreo: 'VIGENTE',
            orgNombreComercial: 'OrgComercial',
            orgNombre: 'Org Completa',
            orgRuc: '20404057805',
            orgTamano: 'GRANDE',
            orgTipo: 'EMPRESA_NACIONAL',
            orgSector: 'AGRICOLA',
            orgUbicacion: 'Lima',
            ...over,
        });

        const leadRow = (over: Partial<LeadExportRow> = {}): LeadExportRow => ({
            id: 11,
            estado: 'EN_PROSPECTO',
            servicioInteres: 'Servicio A',
            comentarios: 'comentario',
            desafioOportunidad: 'desafio',
            historial: 'historial',
            canalCaptacion: 'Web',
            createdAt: new Date('2024-03-15T00:00:00.000Z'),
            fechaCierre: new Date('2024-06-15T00:00:00.000Z'),
            orgNombreComercial: 'OrgComercial',
            orgRuc: '20404057805',
            orgTipo: 'EMPRESA_NACIONAL',
            orgSector: 'AGRICOLA',
            contactoNombre: 'Juan Perez',
            contactoCorreo: 'juan@x.com',
            encargadoNombre: 'Maria',
            proximaActividadNombre: 'Reunión',
            proximaActividadFecha: new Date('2024-04-01T00:00:00.000Z'),
            tieneAlertaActividad: true,
            ...over,
        });

        const cotRow = (
            over: Partial<CotizacionExportRow> = {},
        ): CotizacionExportRow => ({
            id: 99,
            idLead: 11,
            fechaCot: new Date('2024-05-20T00:00:00.000Z'),
            dirigido: 'Empresa Z',
            cliente: 'Cliente Z',
            producto: 'Producto P',
            nombreServicio: 'Servicio S',
            monto: '1500.00',
            tipo: 'USD',
            estado: 'ACEPTADA',
            nombreRemitente: 'Remitente R',
            observacion: 'obs',
            linkPropuesta: 'http://link',
            ...over,
        });

        const baseOptions = (
            over: Partial<ExportOptions> = {},
        ): ExportOptions => ({ includeDeleted: false, ...over });

        beforeEach(() => {
            readRepository = {
                findOrganizations: jest.fn(),
                findContacts: jest.fn(),
                findLeads: jest.fn(),
                findCotizaciones: jest.fn(),
            };
            workbookBuilder = {
                build: jest
                    .fn<(s: SheetDefinition[]) => Promise<Buffer>>()
                    .mockResolvedValue(Buffer.from('xlsx')),
            };
            useCase = new ExportWorkbookUseCase(
                readRepository,
                workbookBuilder,
            );
        });

        const sheetsArg = (): SheetDefinition[] =>
            workbookBuilder.build.mock.calls[0][0];

        it('exports organizaciones only with resolved enum filters (via synonyms)', async () => {
            readRepository.findOrganizations.mockResolvedValue([
                orgRow(),
                orgRow({
                    deletedAt: new Date('2024-01-01T00:00:00.000Z'),
                    ruc: null,
                    contactoActivoNombre: null,
                    alianzasEstrategicas: null,
                    actividadEconomica: null,
                    ubicacion: null,
                    linkedin: null,
                    sector: null,
                    tipo: 'DESCONOCIDO',
                }),
            ]);

            const buffer = await useCase.execute(
                'organizaciones',
                baseOptions({
                    org: {
                        nombre: 'Org',
                        ruc: '20',
                        tipo: 'Empresa nacional',
                        sector: 'Agrícola',
                        tamano: 'Grande',
                    },
                }),
            );

            expect(buffer).toEqual(Buffer.from('xlsx'));
            expect(readRepository.findOrganizations).toHaveBeenCalledWith({
                includeDeleted: false,
                filters: {
                    nombre: 'Org',
                    ruc: '20',
                    tipo: 'EMPRESA_NACIONAL',
                    sector: 'AGRICOLA',
                    tamano: 'GRANDE',
                },
            });
            expect(readRepository.findContacts).not.toHaveBeenCalled();

            const sheets = sheetsArg();
            expect(sheets).toHaveLength(1);
            const orgSheet = sheets[0];
            expect(orgSheet.name).toBe('Organizaciones');
            expect(orgSheet.rows[0].n).toBe(1);
            expect(orgSheet.rows[0].tipo).toBe('Empresa nacional');
            expect(orgSheet.rows[0].estado).toBe('Vigente');
            expect(orgSheet.rows[0].__deleted).toBe(false);
            // Segunda fila: deletedAt y campos nulos -> cadenas vacías y "No vigente".
            expect(orgSheet.rows[1].estado).toBe('No vigente');
            expect(orgSheet.rows[1].ruc).toBe('');
            expect(orgSheet.rows[1].contactoVigente).toBe('');
            expect(orgSheet.rows[1].sector).toBe('');
            // Valor de enum no mapeado -> labelOf devuelve el valor crudo.
            expect(orgSheet.rows[1].tipo).toBe('DESCONOCIDO');
            expect(orgSheet.rows[1].__deleted).toBe(true);
            // highlightWhen.
            expect(orgSheet.highlightWhen?.(orgSheet.rows[0])).toBe(false);
            expect(orgSheet.highlightWhen?.(orgSheet.rows[1])).toBe(true);
        });

        it('resolves enum filters via uppercased label fallback and ignores unrecognized', async () => {
            readRepository.findOrganizations.mockResolvedValue([]);

            await useCase.execute(
                'organizaciones',
                baseOptions({
                    includeDeleted: true,
                    org: {
                        // "EMPRESA_NACIONAL" no está en synonyms keys (que están en minúsculas),
                        // cae al fallback upper-in-labelMap.
                        tipo: 'EMPRESA_NACIONAL',
                        sector: 'XXXXX',
                        tamano: undefined,
                    },
                }),
            );

            expect(readRepository.findOrganizations).toHaveBeenCalledWith({
                includeDeleted: true,
                filters: {
                    nombre: undefined,
                    ruc: undefined,
                    tipo: 'EMPRESA_NACIONAL',
                    sector: undefined,
                    tamano: undefined,
                },
            });
        });

        it('exports contactos with vencido highlight and null fallbacks', async () => {
            readRepository.findContacts.mockResolvedValue([
                contactRow(),
                contactRow({
                    apellidos: null,
                    correo2: null,
                    telefono: null,
                    cargo: null,
                    comentarios: null,
                    orgUbicacion: null,
                    orgRuc: null,
                    estadoCorreo: 'VENCIDO',
                }),
            ]);

            await useCase.execute(
                'contactos',
                baseOptions({
                    contact: {
                        nombre: 'Juan',
                        correo: 'juan@x.com',
                        organizacion: 'OrgComercial',
                    },
                }),
            );

            expect(readRepository.findContacts).toHaveBeenCalledWith({
                filters: {
                    nombre: 'Juan',
                    correo: 'juan@x.com',
                    organizacion: 'OrgComercial',
                },
            });
            const sheet = sheetsArg()[0];
            expect(sheet.name).toBe('Contactos');
            expect(sheet.rows[0].vocativo).toBe('Sr.');
            expect(sheet.rows[0].nombreCompleto).toBe('Juan Perez');
            expect(sheet.rows[0].__vencido).toBe(false);
            expect(sheet.rows[1].apellidos).toBe('');
            expect(sheet.rows[1].nombreCompleto).toBe('Juan');
            expect(sheet.rows[1].correo2).toBe('');
            expect(sheet.rows[1].__vencido).toBe(true);
            expect(sheet.highlightWhen?.(sheet.rows[0])).toBe(false);
            expect(sheet.highlightWhen?.(sheet.rows[1])).toBe(true);
        });

        it('exports leads with alerta highlight and null fallbacks', async () => {
            readRepository.findLeads.mockResolvedValue([
                leadRow(),
                leadRow({
                    comentarios: null,
                    desafioOportunidad: null,
                    historial: null,
                    canalCaptacion: null,
                    fechaCierre: null,
                    orgRuc: null,
                    contactoNombre: null,
                    contactoCorreo: null,
                    proximaActividadNombre: null,
                    proximaActividadFecha: null,
                    tieneAlertaActividad: false,
                    estado: 'OFERTADO',
                }),
            ]);

            await useCase.execute(
                'leads',
                baseOptions({
                    lead: {
                        estado: 'Nuevo',
                        servicio: 'Servicio',
                        organizacion: 'OrgComercial',
                    },
                }),
            );

            expect(readRepository.findLeads).toHaveBeenCalledWith({
                filters: {
                    estado: 'EN_PROSPECTO',
                    servicio: 'Servicio',
                    organizacion: 'OrgComercial',
                },
            });
            const sheet = sheetsArg()[0];
            expect(sheet.name).toBe('Leads');
            expect(sheet.rows[0].anio).toBe(2024);
            expect(sheet.rows[0].estado).toBe('En prospecto');
            expect(sheet.rows[0].alerta).toBe('Sí');
            expect(sheet.rows[0].__alerta).toBe(true);
            expect(sheet.rows[1].rucContacto).toBe('');
            expect(sheet.rows[1].proxActividad).toBe('');
            expect(sheet.rows[1].proxFecha).toBe('');
            expect(sheet.rows[1].fechaCierre).toBe('');
            expect(sheet.rows[1].alerta).toBe('No');
            expect(sheet.rows[1].estado).toBe('Ofertado');
            expect(sheet.highlightWhen?.(sheet.rows[0])).toBe(true);
            expect(sheet.highlightWhen?.(sheet.rows[1])).toBe(false);
        });

        it('exports cotizaciones with null fallbacks', async () => {
            readRepository.findCotizaciones.mockResolvedValue([
                cotRow(),
                cotRow({
                    cliente: null,
                    producto: null,
                    observacion: null,
                    linkPropuesta: null,
                    tipo: 'PEN',
                    estado: 'PENDIENTE',
                }),
            ]);

            await useCase.execute(
                'cotizaciones',
                baseOptions({
                    cotizacion: {
                        cliente: 'Cliente',
                        servicio: 'Servicio',
                        estado: 'Aceptada',
                    },
                }),
            );

            expect(readRepository.findCotizaciones).toHaveBeenCalledWith({
                filters: {
                    cliente: 'Cliente',
                    servicio: 'Servicio',
                    estado: 'ACEPTADA',
                },
            });
            const sheet = sheetsArg()[0];
            expect(sheet.name).toBe('Cotizaciones');
            expect(sheet.rows[0].anio).toBe(2024);
            expect(sheet.rows[0].mes).toBe(5);
            expect(sheet.rows[0].moneda).toBe('USD');
            expect(sheet.rows[0].estado).toBe('Aceptada');
            expect(sheet.rows[1].cliente).toBe('');
            expect(sheet.rows[1].producto).toBe('');
            expect(sheet.rows[1].observacion).toBe('');
            expect(sheet.rows[1].link).toBe('');
            expect(sheet.rows[1].moneda).toBe('PEN');
            expect(sheet.rows[1].estado).toBe('Pendiente');
        });

        it('exports all four sheets for target "all" with no entity filters', async () => {
            readRepository.findOrganizations.mockResolvedValue([orgRow()]);
            readRepository.findContacts.mockResolvedValue([contactRow()]);
            readRepository.findLeads.mockResolvedValue([leadRow()]);
            readRepository.findCotizaciones.mockResolvedValue([cotRow()]);

            await useCase.execute('all', baseOptions({ includeDeleted: true }));

            // Sin sub-objetos org/contact/lead/cotizacion: todos los filtros undefined.
            expect(readRepository.findOrganizations).toHaveBeenCalledWith({
                includeDeleted: true,
                filters: {
                    nombre: undefined,
                    ruc: undefined,
                    tipo: undefined,
                    sector: undefined,
                    tamano: undefined,
                },
            });
            expect(readRepository.findContacts).toHaveBeenCalledWith({
                filters: {
                    nombre: undefined,
                    correo: undefined,
                    organizacion: undefined,
                },
            });
            expect(readRepository.findLeads).toHaveBeenCalledWith({
                filters: {
                    estado: undefined,
                    servicio: undefined,
                    organizacion: undefined,
                },
            });
            expect(readRepository.findCotizaciones).toHaveBeenCalledWith({
                filters: {
                    cliente: undefined,
                    servicio: undefined,
                    estado: undefined,
                },
            });

            const sheets = sheetsArg();
            expect(sheets.map((s) => s.name)).toEqual([
                'Organizaciones',
                'Contactos',
                'Leads',
                'Cotizaciones',
            ]);
        });
    });
});
