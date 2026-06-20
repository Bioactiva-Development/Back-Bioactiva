import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaCrmImportRepository } from '@/modules/data-management/infrastructure/persistence/prisma-crm-import.repository';
import { ImportPlan } from '@/modules/data-management/application/dto/import-types';

describe('Data-management import repository', () => {
    /**
     * PrismaCrmImportRepository
     * ----------
     * Responsable de:
     * - persistir un plan de importación (insert-only) en una transacción
     * - resolver organizaciones/contactos/leads por claves naturales
     * - omitir duplicados y registrar skipped/warnings
     * - garantizar unicidad del código de cliente generado
     * - crear actividad pendiente y cotizaciones ligadas a sus leads
     */
    // STATUS: Implementación completa (commit de importación CRM).
    describe('PrismaCrmImportRepository', () => {
        let repository: PrismaCrmImportRepository;
        let tx: any;
        let mockPrisma: any;

        const emptyPlan = (): ImportPlan => ({
            organizaciones: [],
            contactos: [],
            leads: [],
            cotizaciones: [],
        });

        beforeEach(() => {
            tx = {
                usuario: { findMany: jest.fn() },
                organizacion: {
                    findMany: jest.fn(),
                    create: jest.fn(),
                },
                contacto: {
                    findMany: jest.fn(),
                    create: jest.fn(),
                },
                lead: { create: jest.fn() },
                actividad: { create: jest.fn() },
                cotizacion: { create: jest.fn() },
            };

            // Defaults: sin registros previos.
            tx.usuario.findMany.mockResolvedValue([]);
            tx.organizacion.findMany.mockResolvedValue([]);
            tx.contacto.findMany.mockResolvedValue([]);

            mockPrisma = {
                $transaction: jest.fn(
                    async (cb: (t: any) => Promise<unknown>) => cb(tx),
                ),
            };

            repository = new PrismaCrmImportRepository(mockPrisma);
        });

        const ctx = { authorUserId: 7 };

        it('should return a zeroed summary for an empty plan', async () => {
            const summary = await repository.commit(emptyPlan(), ctx);
            expect(summary.inserted).toEqual({
                organizaciones: 0,
                contactos: 0,
                leads: 0,
                actividades: 0,
                cotizaciones: 0,
            });
            expect(summary.skipped).toHaveLength(0);
            expect(summary.warnings).toHaveLength(0);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });

        describe('organizaciones', () => {
            const org = {
                rowNumber: 2,
                codigoCliente: 'CLI001',
                nombre: 'Altomayo',
                nombreComercial: 'Altomayo SAC',
                ruc: '204',
                tipo: 'PRIVADA',
                tamano: 'GRANDE',
                sector: 'AGRO',
                alianzasEstrategicas: null,
                actividadEconomica: null,
                ubicacion: null,
                linkedin: null,
            };

            it('should insert a new organization with a unique generated code', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                const plan = emptyPlan();
                plan.organizaciones = [org];

                const summary = await repository.commit(plan, ctx);

                expect(summary.inserted.organizaciones).toBe(1);
                expect(tx.organizacion.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            codigoCliente: 'CLI001',
                            sector: 'AGRO',
                            idAuthor: 7,
                        }),
                    }),
                );
            });

            it('should insert an org without ruc without indexing it by ruc', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                const plan = emptyPlan();
                plan.organizaciones = [{ ...org, ruc: null }];

                const summary = await repository.commit(plan, ctx);

                expect(summary.inserted.organizaciones).toBe(1);
                expect(tx.organizacion.create.mock.calls[0][0].data.ruc).toBeNull();
            });

            it('should default sector to null when org.sector is null', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                const plan = emptyPlan();
                plan.organizaciones = [{ ...org, sector: null }];

                await repository.commit(plan, ctx);

                const data = tx.organizacion.create.mock.calls[0][0].data;
                expect(data.sector).toBeNull();
            });

            it('should skip an organization that duplicates by ruc and register its keys', async () => {
                tx.organizacion.findMany.mockResolvedValue([
                    {
                        id: 'existing',
                        ruc: '204',
                        nombre: 'Otro',
                        nombreComercial: 'Otro SAC',
                        codigoCliente: 'OLD',
                    },
                ]);
                const plan = emptyPlan();
                plan.organizaciones = [org];

                const summary = await repository.commit(plan, ctx);

                expect(summary.inserted.organizaciones).toBe(0);
                expect(summary.skipped).toEqual([
                    expect.objectContaining({
                        sheet: 'Organizaciones',
                        row: 2,
                        message: 'La organización ya existe; omitida.',
                    }),
                ]);
                expect(tx.organizacion.create).not.toHaveBeenCalled();
            });

            it('should skip a duplicate by name when ruc is null', async () => {
                tx.organizacion.findMany.mockResolvedValue([
                    {
                        id: 'existing',
                        ruc: null,
                        nombre: 'Altomayo',
                        nombreComercial: 'Distinto',
                        codigoCliente: 'OLD',
                    },
                ]);
                const plan = emptyPlan();
                plan.organizaciones = [{ ...org, ruc: null }];

                const summary = await repository.commit(plan, ctx);
                expect(summary.skipped).toHaveLength(1);
                expect(tx.organizacion.create).not.toHaveBeenCalled();
            });

            it('should generate a suffixed code when the desired one is already used', async () => {
                tx.organizacion.findMany.mockResolvedValue([
                    {
                        id: 'existing',
                        ruc: '999',
                        nombre: 'Other',
                        nombreComercial: 'Other SAC',
                        codigoCliente: 'CLI001',
                    },
                ]);
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                const plan = emptyPlan();
                // ruc/nombre/comercial distintos => no es duplicado, pero el codigo choca.
                plan.organizaciones = [
                    {
                        ...org,
                        ruc: '111',
                        nombre: 'NuevaOrg',
                        nombreComercial: 'NuevaOrg SAC',
                    },
                ];

                const summary = await repository.commit(plan, ctx);

                expect(summary.inserted.organizaciones).toBe(1);
                const data = tx.organizacion.create.mock.calls[0][0].data;
                expect(data.codigoCliente).toBe('CLI001-2');
            });

            it('should keep incrementing the suffix while collisions persist', async () => {
                tx.organizacion.findMany.mockResolvedValue([
                    {
                        id: 'e1',
                        ruc: '999',
                        nombre: 'A',
                        nombreComercial: 'A',
                        codigoCliente: 'CLI001',
                    },
                    {
                        id: 'e2',
                        ruc: '998',
                        nombre: 'B',
                        nombreComercial: 'B',
                        codigoCliente: 'CLI001-2',
                    },
                ]);
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                const plan = emptyPlan();
                plan.organizaciones = [
                    {
                        ...org,
                        ruc: '111',
                        nombre: 'NuevaOrg',
                        nombreComercial: 'NuevaOrg SAC',
                    },
                ];

                await repository.commit(plan, ctx);
                const data = tx.organizacion.create.mock.calls[0][0].data;
                expect(data.codigoCliente).toBe('CLI001-3');
            });
        });

        describe('contactos', () => {
            const baseOrg = {
                rowNumber: 2,
                codigoCliente: 'CLI001',
                nombre: 'Altomayo',
                nombreComercial: 'Altomayo SAC',
                ruc: '204',
                tipo: 'PRIVADA',
                tamano: 'GRANDE',
                sector: null,
                alianzasEstrategicas: null,
                actividadEconomica: null,
                ubicacion: null,
                linkedin: null,
            };
            const contact = {
                rowNumber: 3,
                nombres: 'Ana',
                apellidos: 'Paredes',
                vocativo: 'DOCTORA',
                cargo: 'Gerente',
                correo: 'ana@x.com',
                correo2: null,
                telefono: null,
                comentarios: null,
                orgRuc: '204',
                orgNombreComercial: null,
            };

            it('should insert a contact resolved by org ruc', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.contacto.create.mockResolvedValue({ id: 11 });
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.contactos = [contact];

                const summary = await repository.commit(plan, ctx);

                expect(summary.inserted.contactos).toBe(1);
                expect(tx.contacto.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            correo: 'ana@x.com',
                            vocativo: 'DOCTORA',
                            idOrganizacion: 'org-1',
                        }),
                    }),
                );
            });

            it('should resolve org by nombreComercial and default vocativo to null', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.contacto.create.mockResolvedValue({ id: 11 });
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.contactos = [
                    {
                        ...contact,
                        vocativo: null,
                        orgRuc: null,
                        orgNombreComercial: 'Altomayo SAC',
                    },
                ];

                await repository.commit(plan, ctx);
                const data = tx.contacto.create.mock.calls[0][0].data;
                expect(data.vocativo).toBeNull();
                expect(data.idOrganizacion).toBe('org-1');
            });

            it('should skip a contact whose correo already exists', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.contacto.findMany.mockResolvedValue([
                    { id: 99, correo: 'ana@x.com' },
                ]);
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.contactos = [contact];

                const summary = await repository.commit(plan, ctx);
                expect(summary.inserted.contactos).toBe(0);
                expect(summary.skipped).toContainEqual(
                    expect.objectContaining({
                        sheet: 'Contactos',
                        row: 3,
                        message: 'El contacto (correo) ya existe; omitido.',
                    }),
                );
                expect(tx.contacto.create).not.toHaveBeenCalled();
            });

            it('should skip a contact when its organization cannot be resolved', async () => {
                const plan = emptyPlan();
                plan.contactos = [
                    { ...contact, orgRuc: 'no-existe', orgNombreComercial: null },
                ];

                const summary = await repository.commit(plan, ctx);
                expect(summary.inserted.contactos).toBe(0);
                expect(summary.skipped).toContainEqual(
                    expect.objectContaining({
                        sheet: 'Contactos',
                        row: 3,
                        message:
                            'No se encontró la organización del contacto; omitido.',
                    }),
                );
            });
        });

        describe('leads y actividades', () => {
            const baseOrg = {
                rowNumber: 2,
                codigoCliente: 'CLI001',
                nombre: 'Altomayo',
                nombreComercial: 'Altomayo SAC',
                ruc: '204',
                tipo: 'PRIVADA',
                tamano: 'GRANDE',
                sector: null,
                alianzasEstrategicas: null,
                actividadEconomica: null,
                ubicacion: null,
                linkedin: null,
            };
            const lead = {
                rowNumber: 4,
                excelLeadId: 'L1',
                estado: 'NUEVO',
                servicioInteres: 'Consultoria',
                comentarios: null,
                desafioOportunidad: null,
                canalCaptacion: null,
                createdAt: null,
                fechaCierre: null,
                orgRuc: '204',
                orgNombreComercial: null,
                contactoCorreo: null,
                encargadoNombre: null,
                actividad: null,
            };

            it('should insert a lead resolving encargado by name', async () => {
                tx.usuario.findMany.mockResolvedValue([
                    { id: 50, nombres: 'Luis', apellidos: 'Gomez' },
                ]);
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.lead.create.mockResolvedValue({ id: 100 });
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.leads = [{ ...lead, encargadoNombre: 'Luis Gomez' }];

                const summary = await repository.commit(plan, ctx);

                expect(summary.inserted.leads).toBe(1);
                expect(tx.lead.create.mock.calls[0][0].data.idEncargado).toBe(50);
            });

            it('should warn when encargado name does not exist and fall back to importer', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.lead.create.mockResolvedValue({ id: 100 });
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.leads = [
                    { ...lead, encargadoNombre: 'Fulano Inexistente' },
                ];

                const summary = await repository.commit(plan, ctx);

                expect(tx.lead.create.mock.calls[0][0].data.idEncargado).toBe(7);
                expect(summary.warnings).toContainEqual(
                    expect.objectContaining({
                        sheet: 'Leads',
                        row: 4,
                        message: expect.stringContaining(
                            'Fulano Inexistente',
                        ),
                    }),
                );
            });

            it('should resolve contacto by correo, set createdAt and create pending actividad', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.contacto.create.mockResolvedValue({ id: 11 });
                tx.lead.create.mockResolvedValue({ id: 100 });
                tx.actividad.create.mockResolvedValue({ id: 200 });
                const created = new Date('2024-02-02');
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.contactos = [
                    {
                        rowNumber: 3,
                        nombres: 'Ana',
                        apellidos: 'Paredes',
                        vocativo: null,
                        cargo: null,
                        correo: 'ana@x.com',
                        correo2: null,
                        telefono: null,
                        comentarios: null,
                        orgRuc: '204',
                        orgNombreComercial: null,
                    },
                ];
                plan.leads = [
                    {
                        ...lead,
                        contactoCorreo: 'ana@x.com',
                        createdAt: created,
                        actividad: {
                            nombre: 'Llamada',
                            fecha: new Date('2024-03-03'),
                            tipo: 'LLAMADA',
                        },
                    },
                ];

                const summary = await repository.commit(plan, ctx);

                expect(summary.inserted.leads).toBe(1);
                expect(summary.inserted.actividades).toBe(1);
                const leadData = tx.lead.create.mock.calls[0][0].data;
                expect(leadData.idContacto).toBe(11);
                expect(leadData.createdAt).toBe(created);
                expect(leadData.ultimoCambioEstado).toBe(created);
                const actData = tx.actividad.create.mock.calls[0][0].data;
                expect(actData.fechaInicio).toEqual(new Date('2024-03-03'));
                expect(actData.idResponsable).toBe(7);
            });

            it('should set idContacto null when contactoCorreo cannot be resolved', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.lead.create.mockResolvedValue({ id: 100 });
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.leads = [{ ...lead, contactoCorreo: 'noexiste@x.com' }];

                await repository.commit(plan, ctx);
                expect(tx.lead.create.mock.calls[0][0].data.idContacto).toBeNull();
            });

            it('should default actividad fecha to now when not provided', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.lead.create.mockResolvedValue({ id: 100 });
                tx.actividad.create.mockResolvedValue({ id: 200 });
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.leads = [
                    {
                        ...lead,
                        actividad: {
                            nombre: 'Sin fecha',
                            fecha: null,
                            tipo: 'CORREO',
                        },
                    },
                ];

                await repository.commit(plan, ctx);
                const actData = tx.actividad.create.mock.calls[0][0].data;
                expect(actData.fechaInicio).toBeInstanceOf(Date);
                expect(actData.fechaFin).toBe(actData.fechaInicio);
            });

            it('should skip a lead when its organization cannot be resolved', async () => {
                const plan = emptyPlan();
                plan.leads = [
                    { ...lead, orgRuc: 'noexiste', orgNombreComercial: null },
                ];

                const summary = await repository.commit(plan, ctx);
                expect(summary.inserted.leads).toBe(0);
                expect(summary.skipped).toContainEqual(
                    expect.objectContaining({
                        sheet: 'Leads',
                        row: 4,
                        message:
                            'No se encontró la organización del lead; omitido.',
                    }),
                );
            });

            it('should resolve lead org by nombreComercial and not map excelLeadId when null', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.lead.create.mockResolvedValue({ id: 100 });
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.leads = [
                    {
                        ...lead,
                        excelLeadId: null,
                        orgRuc: null,
                        orgNombreComercial: 'Altomayo SAC',
                    },
                ];

                const summary = await repository.commit(plan, ctx);
                expect(summary.inserted.leads).toBe(1);
                const data = tx.lead.create.mock.calls[0][0].data;
                // createdAt null => no se incluyen createdAt/ultimoCambioEstado
                expect('createdAt' in data).toBe(false);
                expect('ultimoCambioEstado' in data).toBe(false);
            });
        });

        describe('cotizaciones', () => {
            const baseOrg = {
                rowNumber: 2,
                codigoCliente: 'CLI001',
                nombre: 'Altomayo',
                nombreComercial: 'Altomayo SAC',
                ruc: '204',
                tipo: 'PRIVADA',
                tamano: 'GRANDE',
                sector: null,
                alianzasEstrategicas: null,
                actividadEconomica: null,
                ubicacion: null,
                linkedin: null,
            };
            const lead = {
                rowNumber: 4,
                excelLeadId: 'L1',
                estado: 'NUEVO',
                servicioInteres: 'Consultoria',
                comentarios: null,
                desafioOportunidad: null,
                canalCaptacion: null,
                createdAt: null,
                fechaCierre: null,
                orgRuc: '204',
                orgNombreComercial: null,
                contactoCorreo: null,
                encargadoNombre: null,
                actividad: null,
            };
            const cot = {
                rowNumber: 5,
                excelLeadId: 'L1',
                fechaCot: null,
                dirigido: 'Gerente',
                cliente: null,
                producto: null,
                nombreServicio: 'Consultoria',
                monto: '1500',
                tipo: 'PEN',
                estado: 'ENVIADA',
                nombreRemitente: 'Luis',
                observacion: null,
                linkPropuesta: null,
            };

            it('should insert a cotizacion linked to its lead (default fechaCot now)', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.lead.create.mockResolvedValue({ id: 100 });
                tx.cotizacion.create.mockResolvedValue({ id: 300 });
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.leads = [lead];
                plan.cotizaciones = [cot];

                const summary = await repository.commit(plan, ctx);

                expect(summary.inserted.cotizaciones).toBe(1);
                const data = tx.cotizacion.create.mock.calls[0][0].data;
                expect(data.idLead).toBe(100);
                expect(data.fechaCot).toBeInstanceOf(Date);
                expect(data.idRemitente).toBe(7);
            });

            it('should keep provided fechaCot when present', async () => {
                tx.organizacion.create.mockResolvedValue({ id: 'org-1' });
                tx.lead.create.mockResolvedValue({ id: 100 });
                tx.cotizacion.create.mockResolvedValue({ id: 300 });
                const fecha = new Date('2024-06-06');
                const plan = emptyPlan();
                plan.organizaciones = [baseOrg];
                plan.leads = [lead];
                plan.cotizaciones = [{ ...cot, fechaCot: fecha }];

                await repository.commit(plan, ctx);
                expect(tx.cotizacion.create.mock.calls[0][0].data.fechaCot).toBe(
                    fecha,
                );
            });

            it('should skip a cotizacion whose excelLeadId is not found', async () => {
                const plan = emptyPlan();
                plan.cotizaciones = [{ ...cot, excelLeadId: 'L-unknown' }];

                const summary = await repository.commit(plan, ctx);
                expect(summary.inserted.cotizaciones).toBe(0);
                expect(summary.skipped).toContainEqual(
                    expect.objectContaining({
                        sheet: 'Cotizaciones',
                        row: 5,
                        message: expect.stringContaining('L-unknown'),
                    }),
                );
                expect(tx.cotizacion.create).not.toHaveBeenCalled();
            });

            it('should skip a cotizacion with null excelLeadId (empty in message)', async () => {
                const plan = emptyPlan();
                plan.cotizaciones = [{ ...cot, excelLeadId: null }];

                const summary = await repository.commit(plan, ctx);
                expect(summary.inserted.cotizaciones).toBe(0);
                expect(summary.skipped[0].message).toContain(
                    'No se encontró el lead "" (',
                );
            });
        });
    });
});
