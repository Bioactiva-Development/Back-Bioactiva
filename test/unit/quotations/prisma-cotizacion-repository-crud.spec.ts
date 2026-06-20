import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaCotizacionRepository } from '@/modules/quotations/infrastructure/persistance/prisma-cotizacion.repository';
import { Cotizacion } from '@/modules/quotations/domain/entities/cotizacion';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';
import { CotizacionNotFoundException } from '@/modules/quotations/domain/exceptions/cotizacion-not-found.exception';

const baseRecord = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    fechaCot: new Date('2026-02-01T00:00:00.000Z'),
    dirigido: 'Dr. Martinez',
    cliente: 'TechCorp SA',
    producto: 'Licencia',
    nombreRemitente: 'Juan Perez',
    nombreServicio: 'Desarrollo',
    monto: '5000.00',
    tipo: 'USD',
    estado: 'PENDIENTE',
    observacion: null,
    linkPropuesta: null,
    idLead: 10,
    idRemitente: 7,
    idAuthor: 3,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
});

const enrichedRecord = (overrides: Record<string, unknown> = {}) =>
    baseRecord({
        lead: {
            servicioInteres: 'Consultoría',
            estado: 'OFERTADO',
            contacto: { nombres: 'María', apellidos: 'Gómez' },
        },
        remitente: { nombres: 'Juan', apellidos: 'Perez' },
        ...overrides,
    });

const buildDomain = (id: number | null) =>
    new Cotizacion(
        id,
        new Date('2026-02-01T00:00:00.000Z'),
        'Dr. Martinez',
        'TechCorp SA',
        'Licencia',
        'Juan Perez',
        'Desarrollo',
        '5000.00',
        TipoMoneda.USD,
        EstadoCot.PENDIENTE,
        null,
        null,
        10,
        7,
        3,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-02T00:00:00.000Z'),
        null,
    );

function createPrismaError(code: string, message: string) {
    const error = new Error(message) as any;
    error.code = code;
    error.name = 'PrismaClientKnownRequestError';
    return error;
}

describe('Quotations module', () => {
    describe('PrismaCotizacionRepository (CRUD + error handling)', () => {
        let repository: PrismaCotizacionRepository;
        let prismaService: any;

        beforeEach(() => {
            prismaService = {
                cotizacion: {
                    findFirst: jest.fn(),
                    findMany: jest.fn(),
                    create: jest.fn(),
                    update: jest.fn(),
                    count: jest.fn(),
                },
                lead: { update: jest.fn() },
                $transaction: jest.fn(),
            };
            repository = new PrismaCotizacionRepository(prismaService as any);
        });

        describe('findById', () => {
            it('returns the mapped domain entity when found', async () => {
                prismaService.cotizacion.findFirst.mockResolvedValue(
                    baseRecord(),
                );

                const result = await repository.findById(1);

                expect(prismaService.cotizacion.findFirst).toHaveBeenCalledWith({
                    where: { id: 1, deletedAt: null },
                });
                expect(result).toBeInstanceOf(Cotizacion);
                expect(result?.id).toBe(1);
            });

            it('returns null when no record is found', async () => {
                prismaService.cotizacion.findFirst.mockResolvedValue(null);

                expect(await repository.findById(99)).toBeNull();
            });

            it('re-throws unknown errors via handlePrismaError', async () => {
                const err = createPrismaError('P2000', 'too long');
                prismaService.cotizacion.findFirst.mockRejectedValue(err);

                await expect(repository.findById(1)).rejects.toBe(err);
            });

            it('maps a P2025 without context to the generic message', async () => {
                prismaService.cotizacion.findFirst.mockRejectedValue(
                    createPrismaError('P2025', 'Record not found.'),
                );

                await expect(repository.findById(1)).rejects.toThrow(
                    'Registro no encontrado',
                );
            });
        });

        describe('findByIdWithRelations', () => {
            it('returns the enriched relation view when found', async () => {
                prismaService.cotizacion.findFirst.mockResolvedValue(
                    enrichedRecord(),
                );

                const result = await repository.findByIdWithRelations(1);

                expect(result?.cotizacion.id).toBe(1);
                expect(result?.leadServicioInteres).toBe('Consultoría');
                expect(result?.leadEstado).toBe('OFERTADO');
                expect(result?.contactName).toBe('María Gómez');
                expect(result?.remitenteNombre).toBe('Juan');
                expect(result?.remitenteApellidos).toBe('Perez');
            });

            it('falls back to empty strings when relations are missing', async () => {
                prismaService.cotizacion.findFirst.mockResolvedValue(
                    baseRecord({ lead: null, remitente: null }),
                );

                const result = await repository.findByIdWithRelations(1);

                expect(result?.leadServicioInteres).toBe('');
                expect(result?.leadEstado).toBe('');
                expect(result?.contactName).toBe('');
                expect(result?.remitenteNombre).toBe('');
                expect(result?.remitenteApellidos).toBe('');
            });

            it('trims contact name when apellidos is null', async () => {
                prismaService.cotizacion.findFirst.mockResolvedValue(
                    enrichedRecord({
                        lead: {
                            servicioInteres: 'Consultoría',
                            estado: 'OFERTADO',
                            contacto: { nombres: 'María', apellidos: null },
                        },
                    }),
                );

                const result = await repository.findByIdWithRelations(1);

                expect(result?.contactName).toBe('María');
            });

            it('returns null when no record is found', async () => {
                prismaService.cotizacion.findFirst.mockResolvedValue(null);

                expect(await repository.findByIdWithRelations(1)).toBeNull();
            });

            it('re-throws unknown errors via handlePrismaError', async () => {
                const err = createPrismaError('P2000', 'boom');
                prismaService.cotizacion.findFirst.mockRejectedValue(err);

                await expect(
                    repository.findByIdWithRelations(1),
                ).rejects.toBe(err);
            });
        });

        describe('save', () => {
            it('creates when id is null', async () => {
                prismaService.cotizacion.create.mockResolvedValue(baseRecord());

                const result = await repository.save(buildDomain(null));

                expect(prismaService.cotizacion.create).toHaveBeenCalled();
                expect(result).toBeInstanceOf(Cotizacion);
            });

            it('updates and stamps updatedAt when id is present', async () => {
                prismaService.cotizacion.update.mockResolvedValue(baseRecord());

                await repository.save(buildDomain(1));

                expect(prismaService.cotizacion.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: 1 },
                        data: expect.objectContaining({
                            updatedAt: expect.any(Date),
                        }),
                    }),
                );
            });

            it('translates a P2003 on idLead to a not-found exception', async () => {
                prismaService.cotizacion.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed on the field: `idLead`',
                    ),
                );

                await expect(repository.save(buildDomain(null))).rejects.toThrow(
                    'Lead no encontrado',
                );
            });

            it('translates a P2003 on idRemitente to a not-found exception', async () => {
                prismaService.cotizacion.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed on the field: `idRemitente`',
                    ),
                );

                await expect(repository.save(buildDomain(null))).rejects.toThrow(
                    'Remitente no encontrado',
                );
            });

            it('translates a P2003 on an unknown field to a generic not-found exception', async () => {
                prismaService.cotizacion.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed on the field: `idAuthor`',
                    ),
                );

                await expect(repository.save(buildDomain(null))).rejects.toThrow(
                    /idAuthor/,
                );
            });

            it('falls back to "desconocido" when the field cannot be parsed', async () => {
                prismaService.cotizacion.create.mockRejectedValue(
                    createPrismaError('P2003', 'Foreign key constraint failed'),
                );

                await expect(repository.save(buildDomain(null))).rejects.toThrow(
                    /desconocido/,
                );
            });

            it('translates a P2025 on update to a not-found exception with the id', async () => {
                prismaService.cotizacion.update.mockRejectedValue(
                    createPrismaError('P2025', 'Record to update not found.'),
                );

                await expect(repository.save(buildDomain(1))).rejects.toThrow(
                    'Cotización con id 1 no encontrada',
                );
            });
        });

        describe('saveWithRelations', () => {
            it('returns the enriched view after saving', async () => {
                prismaService.cotizacion.create.mockResolvedValue(baseRecord());
                prismaService.cotizacion.findFirst.mockResolvedValue(
                    enrichedRecord(),
                );

                const result = await repository.saveWithRelations(
                    buildDomain(null),
                );

                expect(result.cotizacion.id).toBe(1);
                expect(result.contactName).toBe('María Gómez');
            });

            it('throws when the saved record cannot be re-fetched', async () => {
                prismaService.cotizacion.update.mockResolvedValue(baseRecord());
                prismaService.cotizacion.findFirst.mockResolvedValue(null);

                await expect(
                    repository.saveWithRelations(buildDomain(1)),
                ).rejects.toBeInstanceOf(CotizacionNotFoundException);
            });
        });

        describe('list (additional filters)', () => {
            beforeEach(() => {
                prismaService.cotizacion.findMany.mockResolvedValue([]);
            });

            it('filters by idRemitente', async () => {
                await repository.list({ idRemitente: 7 });

                const callArg =
                    prismaService.cotizacion.findMany.mock.calls[0][0];
                expect(callArg.where.idRemitente).toBe(7);
            });

            it('builds a date range from fechaDesde and fechaHasta', async () => {
                const desde = new Date('2026-01-01T00:00:00.000Z');
                const hasta = new Date('2026-12-31T00:00:00.000Z');

                await repository.list({
                    fechaDesde: desde,
                    fechaHasta: hasta,
                } as any);

                const callArg =
                    prismaService.cotizacion.findMany.mock.calls[0][0];
                expect(callArg.where.fechaCot).toEqual({
                    gte: desde,
                    lte: hasta,
                });
            });

            it('builds a date range with only fechaDesde', async () => {
                const desde = new Date('2026-01-01T00:00:00.000Z');

                await repository.list({ fechaDesde: desde } as any);

                const callArg =
                    prismaService.cotizacion.findMany.mock.calls[0][0];
                expect(callArg.where.fechaCot).toEqual({ gte: desde });
            });

            it('builds a date range with only fechaHasta', async () => {
                const hasta = new Date('2026-12-31T00:00:00.000Z');

                await repository.list({ fechaHasta: hasta } as any);

                const callArg =
                    prismaService.cotizacion.findMany.mock.calls[0][0];
                expect(callArg.where.fechaCot).toEqual({ lte: hasta });
            });

            it('ignores an invalid estado value', async () => {
                await repository.list({ estado: 'NOPE' });

                const callArg =
                    prismaService.cotizacion.findMany.mock.calls[0][0];
                expect(callArg.where.estado).toBeUndefined();
            });

            it('maps returned records to the enriched view', async () => {
                prismaService.cotizacion.findMany.mockResolvedValue([
                    enrichedRecord(),
                ]);

                const result = await repository.list();

                expect(result).toHaveLength(1);
                expect(result[0].contactName).toBe('María Gómez');
            });

            it('re-throws unknown errors from findMany', async () => {
                const err = createPrismaError('P2000', 'boom');
                prismaService.cotizacion.findMany.mockRejectedValue(err);

                await expect(repository.list()).rejects.toBe(err);
            });
        });

        describe('count', () => {
            it('returns the count for the built where clause', async () => {
                prismaService.cotizacion.count.mockResolvedValue(42);

                const result = await repository.count({ idLead: 10 });

                expect(prismaService.cotizacion.count).toHaveBeenCalledWith({
                    where: expect.objectContaining({
                        idLead: 10,
                        deletedAt: null,
                    }),
                });
                expect(result).toBe(42);
            });

            it('re-throws unknown errors from count', async () => {
                const err = createPrismaError('P2000', 'boom');
                prismaService.cotizacion.count.mockRejectedValue(err);

                await expect(repository.count()).rejects.toBe(err);
            });
        });
    });
});
