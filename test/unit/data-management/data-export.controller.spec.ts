import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { DataExportController } from '@/modules/data-management/infrastructure/http/data-export.controller';
import { ExportWorkbookUseCase } from '@/modules/data-management/application/use-cases/export-workbook.use-case';

const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

describe('Data management module', () => {
    describe('DataExportController', () => {
        let controller: DataExportController;
        let exportWorkbook: any;
        let res: any;

        const buffer = Buffer.from('workbook-bytes');

        beforeEach(async () => {
            exportWorkbook = { execute: jest.fn().mockResolvedValue(buffer) };
            res = { set: jest.fn(), end: jest.fn() };

            const module = await Test.createTestingModule({
                controllers: [DataExportController],
                providers: [
                    {
                        provide: ExportWorkbookUseCase,
                        useValue: exportWorkbook,
                    },
                ],
            }).compile();

            controller = module.get(DataExportController);
        });

        const assertResponse = (baseName: string) => {
            const stamp = new Date().toISOString().slice(0, 10);
            expect(res.set).toHaveBeenCalledWith({
                'Content-Type': XLSX_MIME,
                'Content-Disposition': `attachment; filename="${baseName}_${stamp}.xlsx"`,
                'Content-Length': String(buffer.length),
            });
            expect(res.end).toHaveBeenCalledWith(buffer);
        };

        it('exports organizaciones with all filters and includeDeleted', async () => {
            await controller.exportOrganizaciones(
                {
                    includeDeleted: true,
                    nombre: 'Org',
                    ruc: '20',
                    sector: 'Agrícola',
                    tipo: 'Empresa nacional',
                    tamano: 'Grande',
                },
                res,
            );

            expect(exportWorkbook.execute).toHaveBeenCalledWith(
                'organizaciones',
                {
                    includeDeleted: true,
                    org: {
                        nombre: 'Org',
                        ruc: '20',
                        sector: 'Agrícola',
                        tipo: 'Empresa nacional',
                        tamano: 'Grande',
                    },
                },
            );
            assertResponse('organizaciones');
        });

        it('defaults includeDeleted to false for organizaciones when omitted', async () => {
            await controller.exportOrganizaciones({}, res);

            expect(exportWorkbook.execute).toHaveBeenCalledWith(
                'organizaciones',
                {
                    includeDeleted: false,
                    org: {
                        nombre: undefined,
                        ruc: undefined,
                        sector: undefined,
                        tipo: undefined,
                        tamano: undefined,
                    },
                },
            );
            assertResponse('organizaciones');
        });

        it('exports contactos', async () => {
            await controller.exportContactos(
                {
                    nombre: 'Juan',
                    correo: 'j@x.com',
                    organizacion: 'Org',
                },
                res,
            );

            expect(exportWorkbook.execute).toHaveBeenCalledWith('contactos', {
                includeDeleted: false,
                contact: {
                    nombre: 'Juan',
                    correo: 'j@x.com',
                    organizacion: 'Org',
                },
            });
            assertResponse('contactos');
        });

        it('exports leads', async () => {
            await controller.exportLeads(
                {
                    estado: 'Nuevo',
                    servicio: 'S',
                    organizacion: 'Org',
                },
                res,
            );

            expect(exportWorkbook.execute).toHaveBeenCalledWith('leads', {
                includeDeleted: false,
                lead: {
                    estado: 'Nuevo',
                    servicio: 'S',
                    organizacion: 'Org',
                },
            });
            assertResponse('leads');
        });

        it('exports cotizaciones', async () => {
            await controller.exportCotizaciones(
                {
                    cliente: 'C',
                    servicio: 'S',
                    estado: 'Aceptada',
                },
                res,
            );

            expect(exportWorkbook.execute).toHaveBeenCalledWith(
                'cotizaciones',
                {
                    includeDeleted: false,
                    cotizacion: {
                        cliente: 'C',
                        servicio: 'S',
                        estado: 'Aceptada',
                    },
                },
            );
            assertResponse('cotizaciones');
        });

        it('exports all with includeDeleted true', async () => {
            await controller.exportAll({ includeDeleted: true }, res);

            expect(exportWorkbook.execute).toHaveBeenCalledWith('all', {
                includeDeleted: true,
            });
            assertResponse('crm_bioactiva');
        });

        it('exports all defaulting includeDeleted to false', async () => {
            await controller.exportAll({}, res);

            expect(exportWorkbook.execute).toHaveBeenCalledWith('all', {
                includeDeleted: false,
            });
            assertResponse('crm_bioactiva');
        });
    });
});
