import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaCrmReadRepository } from '@/modules/data-management/infrastructure/persistence/prisma-crm-read.repository';

describe('Data-management read repository', () => {
    /**
     * PrismaCrmReadRepository
     * ----------
     * Responsable de:
     * - leer organizaciones, contactos, leads y cotizaciones para exportación
     * - aplicar filtros de texto "contiene" (insensible a mayúsculas)
     * - mapear los registros Prisma a las filas de exportación
     * - construir el historial de actividades y la próxima actividad del lead
     */
    // STATUS: Implementación completa (consultas de lectura para export).
    describe('PrismaCrmReadRepository', () => {
        let repository: PrismaCrmReadRepository;
        let mockPrisma: any;

        beforeEach(() => {
            mockPrisma = {
                organizacion: { findMany: jest.fn() },
                contacto: { findMany: jest.fn() },
                lead: { findMany: jest.fn() },
                cotizacion: { findMany: jest.fn() },
            };
            repository = new PrismaCrmReadRepository(mockPrisma);
        });

        describe('findOrganizations', () => {
            it('should apply all filters and map records including active contact name', async () => {
                mockPrisma.organizacion.findMany.mockResolvedValue([
                    {
                        codigoCliente: 'C001',
                        nombre: 'Altomayo',
                        nombreComercial: 'Altomayo SAC',
                        ruc: '20404057805',
                        tipo: 'PRIVADA',
                        tamano: 'GRANDE',
                        sector: 'AGRO',
                        alianzasEstrategicas: null,
                        actividadEconomica: 'Cafe',
                        ubicacion: 'Lima',
                        linkedin: null,
                        contactoActivo: {
                            nombres: 'Ana',
                            apellidos: 'Paredes',
                        },
                        deletedAt: null,
                    },
                ]);

                const result = await repository.findOrganizations({
                    includeDeleted: false,
                    filters: {
                        nombre: 'alto',
                        ruc: '204',
                        tipo: 'PRIVADA',
                        sector: 'AGRO',
                        tamano: 'GRANDE',
                    },
                });

                const where = mockPrisma.organizacion.findMany.mock
                    .calls[0][0].where;
                expect(where.deletedAt).toBeNull();
                expect(where.OR).toEqual([
                    { nombre: { contains: 'alto', mode: 'insensitive' } },
                    {
                        nombreComercial: {
                            contains: 'alto',
                            mode: 'insensitive',
                        },
                    },
                ]);
                expect(where.ruc).toEqual({
                    contains: '204',
                    mode: 'insensitive',
                });
                expect(where.tipo).toBe('PRIVADA');
                expect(where.sector).toBe('AGRO');
                expect(where.tamano).toBe('GRANDE');

                expect(result).toHaveLength(1);
                expect(result[0].contactoActivoNombre).toBe('Ana Paredes');
                expect(result[0].codigoCliente).toBe('C001');
            });

            it('should include deleted records and handle null active contact / no filters', async () => {
                mockPrisma.organizacion.findMany.mockResolvedValue([
                    {
                        codigoCliente: 'C002',
                        nombre: 'Beta',
                        nombreComercial: 'Beta',
                        ruc: null,
                        tipo: 'PRIVADA',
                        tamano: 'PEQUENA',
                        sector: null,
                        alianzasEstrategicas: null,
                        actividadEconomica: null,
                        ubicacion: null,
                        linkedin: null,
                        contactoActivo: null,
                        deletedAt: new Date('2024-01-01'),
                    },
                ]);

                const result = await repository.findOrganizations({
                    includeDeleted: true,
                });

                const where = mockPrisma.organizacion.findMany.mock
                    .calls[0][0].where;
                // includeDeleted true => no se filtra deletedAt
                expect('deletedAt' in where).toBe(false);
                expect(where.OR).toBeUndefined();
                expect(result[0].contactoActivoNombre).toBeNull();
                expect(result[0].deletedAt).toBeInstanceOf(Date);
            });

            it('should return empty array when no organizations found', async () => {
                mockPrisma.organizacion.findMany.mockResolvedValue([]);
                const result = await repository.findOrganizations({
                    includeDeleted: false,
                    filters: {},
                });
                expect(result).toHaveLength(0);
            });
        });

        describe('findContacts', () => {
            it('should apply all filters and map records', async () => {
                mockPrisma.contacto.findMany.mockResolvedValue([
                    {
                        id: 1,
                        vocativo: 'DOCTORA',
                        nombres: 'Ana',
                        apellidos: 'Paredes',
                        correo: 'ana@x.com',
                        correo2: null,
                        telefono: '999',
                        cargo: 'Gerente',
                        comentarios: null,
                        estado_correo: 'VIGENTE',
                        organizacion: {
                            nombreComercial: 'Altomayo SAC',
                            nombre: 'Altomayo',
                            ruc: '204',
                            tamano: 'GRANDE',
                            tipo: 'PRIVADA',
                            sector: 'AGRO',
                            ubicacion: 'Lima',
                        },
                    },
                ]);

                const result = await repository.findContacts({
                    filters: {
                        nombre: 'ana',
                        correo: 'x.com',
                        organizacion: 'alto',
                    },
                });

                const where = mockPrisma.contacto.findMany.mock.calls[0][0]
                    .where;
                expect(where.OR).toEqual([
                    { nombres: { contains: 'ana', mode: 'insensitive' } },
                    { apellidos: { contains: 'ana', mode: 'insensitive' } },
                ]);
                expect(where.correo).toEqual({
                    contains: 'x.com',
                    mode: 'insensitive',
                });
                expect(where.organizacion.OR).toEqual([
                    { nombre: { contains: 'alto', mode: 'insensitive' } },
                    {
                        nombreComercial: {
                            contains: 'alto',
                            mode: 'insensitive',
                        },
                    },
                ]);

                expect(result[0].estadoCorreo).toBe('VIGENTE');
                expect(result[0].orgNombreComercial).toBe('Altomayo SAC');
            });

            it('should work with no opts and empty filters', async () => {
                mockPrisma.contacto.findMany.mockResolvedValue([]);
                const result = await repository.findContacts();
                const where = mockPrisma.contacto.findMany.mock.calls[0][0]
                    .where;
                expect(where).toEqual({});
                expect(result).toHaveLength(0);
            });
        });

        describe('findLeads', () => {
            const baseLead = {
                id: 1,
                estado: 'NUEVO',
                servicioInteres: 'Consultoria',
                comentarios: null,
                desafioOportunidad: null,
                canalCaptacion: 'WEB',
                createdAt: new Date('2024-01-01'),
                fechaCierre: null,
                organizacion: {
                    nombreComercial: 'Altomayo',
                    ruc: '204',
                    tipo: 'PRIVADA',
                    sector: 'AGRO',
                },
                contacto: {
                    nombres: 'Ana',
                    apellidos: 'Paredes',
                    correo: 'ana@x.com',
                },
                encargado: { nombres: 'Luis', apellidos: 'Gomez' },
                actividades: [],
            };

            it('should apply filters and compute historial + pending activity with alert', async () => {
                const past = new Date(Date.now() - 86_400_000);
                mockPrisma.lead.findMany.mockResolvedValue([
                    {
                        ...baseLead,
                        actividades: [
                            {
                                nombreActividad: 'Llamada',
                                // Fecha en hora local para que getDate()/getMonth()
                                // del helper sean deterministas en cualquier zona.
                                fechaInicio: new Date(2024, 2, 5),
                                fechaFin: past,
                                estado: 'PENDIENTE',
                                notas: 'urgente',
                            },
                            {
                                nombreActividad: 'Reunion',
                                fechaInicio: new Date(2024, 3, 10),
                                fechaFin: new Date(2024, 3, 10),
                                estado: 'COMPLETADA',
                                notas: null,
                            },
                        ],
                    },
                ]);

                const result = await repository.findLeads({
                    filters: {
                        estado: 'NUEVO',
                        servicio: 'cons',
                        organizacion: 'alto',
                    },
                });

                const where = mockPrisma.lead.findMany.mock.calls[0][0].where;
                expect(where.deletedAt).toBeNull();
                expect(where.estado).toBe('NUEVO');
                expect(where.servicioInteres).toEqual({
                    contains: 'cons',
                    mode: 'insensitive',
                });
                expect(where.organizacion.OR).toHaveLength(2);

                const row = result[0];
                // historial: una linea con notas, otra sin notas
                expect(row.historial).toContain('05/03/2024 · Llamada (PENDIENTE): urgente');
                expect(row.historial).toContain('10/04/2024 · Reunion (COMPLETADA)');
                expect(row.proximaActividadNombre).toBe('Llamada');
                expect(row.proximaActividadFecha).toEqual(new Date(2024, 2, 5));
                expect(row.tieneAlertaActividad).toBe(true);
                expect(row.contactoNombre).toBe('Ana Paredes');
                expect(row.contactoCorreo).toBe('ana@x.com');
                expect(row.encargadoNombre).toBe('Luis Gomez');
            });

            it('should report no alert when pending activity fechaFin is in the future', async () => {
                const future = new Date(Date.now() + 86_400_000);
                mockPrisma.lead.findMany.mockResolvedValue([
                    {
                        ...baseLead,
                        actividades: [
                            {
                                nombreActividad: 'Futuro',
                                fechaInicio: new Date('2024-05-01'),
                                fechaFin: future,
                                estado: 'PENDIENTE',
                                notas: null,
                            },
                        ],
                    },
                ]);

                const result = await repository.findLeads();
                expect(result[0].tieneAlertaActividad).toBe(false);
                expect(result[0].proximaActividadNombre).toBe('Futuro');
            });

            it('should handle null contacto and no pending activity (historial null)', async () => {
                mockPrisma.lead.findMany.mockResolvedValue([
                    {
                        ...baseLead,
                        contacto: null,
                        actividades: [],
                    },
                ]);

                const result = await repository.findLeads({ filters: {} });
                const row = result[0];
                expect(row.contactoNombre).toBeNull();
                expect(row.contactoCorreo).toBeNull();
                expect(row.historial).toBeNull();
                expect(row.proximaActividadNombre).toBeNull();
                expect(row.proximaActividadFecha).toBeNull();
                expect(row.tieneAlertaActividad).toBe(false);
            });

            it('should return empty array and apply only deletedAt filter with no filters', async () => {
                mockPrisma.lead.findMany.mockResolvedValue([]);
                const result = await repository.findLeads();
                const where = mockPrisma.lead.findMany.mock.calls[0][0].where;
                expect(where).toEqual({ deletedAt: null });
                expect(result).toHaveLength(0);
            });
        });

        describe('findCotizaciones', () => {
            it('should apply all filters and stringify monto', async () => {
                mockPrisma.cotizacion.findMany.mockResolvedValue([
                    {
                        id: 1,
                        idLead: 5,
                        fechaCot: new Date('2024-01-01'),
                        dirigido: 'Gerente',
                        cliente: 'Altomayo',
                        producto: 'Servicio',
                        nombreServicio: 'Consultoria',
                        monto: { toString: () => '1500.50' },
                        tipo: 'PEN',
                        estado: 'ENVIADA',
                        nombreRemitente: 'Luis',
                        observacion: null,
                        linkPropuesta: null,
                    },
                ]);

                const result = await repository.findCotizaciones({
                    filters: {
                        cliente: 'alto',
                        servicio: 'cons',
                        estado: 'ENVIADA',
                    },
                });

                const where = mockPrisma.cotizacion.findMany.mock.calls[0][0]
                    .where;
                expect(where.deletedAt).toBeNull();
                expect(where.cliente).toEqual({
                    contains: 'alto',
                    mode: 'insensitive',
                });
                expect(where.nombreServicio).toEqual({
                    contains: 'cons',
                    mode: 'insensitive',
                });
                expect(where.estado).toBe('ENVIADA');
                expect(result[0].monto).toBe('1500.50');
                expect(result[0].idLead).toBe(5);
            });

            it('should work with no filters and return empty array', async () => {
                mockPrisma.cotizacion.findMany.mockResolvedValue([]);
                const result = await repository.findCotizaciones();
                const where = mockPrisma.cotizacion.findMany.mock.calls[0][0]
                    .where;
                expect(where).toEqual({ deletedAt: null });
                expect(result).toHaveLength(0);
            });
        });
    });
});
