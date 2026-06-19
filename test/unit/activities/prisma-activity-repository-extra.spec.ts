import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaActivityRepository } from '@/modules/activities/infrastructure/persistance/prisma-activity.repository';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

/**
 * PrismaActivityRepository (cobertura adicional)
 * ----------------------------------------------
 * Cubre ramas no ejercidas por prisma-activity-repository.spec.ts:
 * - findById / findByIdWithRelations: hit, miss y propagación de errores.
 * - findPendingByLead: propagación de errores.
 * - list: mapeo de registros con y sin relaciones; filtros con estado/tipo
 *   inválidos (que se descartan) y sin filtros de fecha.
 * - count: con filtros y propagación de errores.
 * - P2003 con campo desconocido y sin campo en el mensaje.
 */
describe('Activities module', () => {
    describe('PrismaActivityRepository (cobertura adicional)', () => {
        let repository: PrismaActivityRepository;
        let prismaService: any;

        const prismaRecord = (overrides?: Record<string, unknown>) => ({
            id: 1,
            nombreActividad: 'Llamada',
            fechaInicio: new Date('2026-06-01T10:00:00.000Z'),
            fechaFin: new Date('2026-06-01T11:00:00.000Z'),
            tipo: 'LLAMADA',
            estado: 'PENDIENTE',
            notas: null,
            outlookEventId: null,
            outlookImported: false,
            teamsMeetingUrl: null,
            seguimientoAutomatico: false,
            idLead: 1,
            idResponsable: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            ...overrides,
        });

        const buildNewActividad = () =>
            new Actividad(
                0,
                'Llamada',
                new Date('2026-06-01T10:00:00.000Z'),
                new Date('2026-06-01T11:00:00.000Z'),
                TipoActividad.LLAMADA,
                EstadoActividad.PENDIENTE,
                null,
                null,
                false,
                null,
                false,
                1,
                1,
                new Date(),
                new Date(),
                null,
            );

        function createPrismaError(code: string, message: string) {
            const error = new Error(message) as any;
            error.code = code;
            error.name = 'PrismaClientKnownRequestError';
            return error;
        }

        beforeEach(() => {
            prismaService = {
                actividad: {
                    create: jest.fn(),
                    update: jest.fn(),
                    findFirst: jest.fn(),
                    findMany: jest.fn(),
                    count: jest.fn(),
                },
            };
            repository = new PrismaActivityRepository(prismaService);
        });

        describe('findById', () => {
            it('should return the mapped activity when found', async () => {
                prismaService.actividad.findFirst.mockResolvedValue(
                    prismaRecord(),
                );

                const result = await repository.findById(1);

                expect(result?.id).toBe(1);
                expect(prismaService.actividad.findFirst).toHaveBeenCalledWith({
                    where: { id: 1, deletedAt: null },
                });
            });

            it('should return null when not found', async () => {
                prismaService.actividad.findFirst.mockResolvedValue(null);

                expect(await repository.findById(1)).toBeNull();
            });

            it('should propagate prisma errors via handlePrismaError', async () => {
                prismaService.actividad.findFirst.mockRejectedValue(
                    createPrismaError('P2025', 'Record not found.'),
                );

                await expect(repository.findById(1)).rejects.toThrow(
                    ActivityNotFoundException,
                );
            });
        });

        describe('findByIdWithRelations', () => {
            it('should map enriched record when found', async () => {
                prismaService.actividad.findFirst.mockResolvedValue(
                    prismaRecord({
                        lead: {
                            servicioInteres: 'Consultoría',
                            estado: 'EN_PROSPECTO',
                        },
                        responsable: { nombres: 'Carlos', apellidos: 'López' },
                    }),
                );

                const result = await repository.findByIdWithRelations(1);

                expect(result?.leadServicioInteres).toBe('Consultoría');
                expect(result?.responsableNombre).toBe('Carlos');
            });

            it('should fall back to empty strings when relations are missing', async () => {
                prismaService.actividad.findFirst.mockResolvedValue(
                    prismaRecord({ lead: null, responsable: null }),
                );

                const result = await repository.findByIdWithRelations(1);

                expect(result?.leadServicioInteres).toBe('');
                expect(result?.leadEstado).toBe('');
                expect(result?.responsableNombre).toBe('');
                expect(result?.responsableApellidos).toBe('');
            });

            it('should return null when not found', async () => {
                prismaService.actividad.findFirst.mockResolvedValue(null);

                expect(await repository.findByIdWithRelations(1)).toBeNull();
            });

            it('should propagate prisma errors', async () => {
                prismaService.actividad.findFirst.mockRejectedValue(
                    new Error('boom'),
                );

                await expect(
                    repository.findByIdWithRelations(1),
                ).rejects.toThrow('boom');
            });
        });

        describe('findPendingByLead', () => {
            it('should propagate prisma errors', async () => {
                prismaService.actividad.findFirst.mockRejectedValue(
                    new Error('db down'),
                );

                await expect(repository.findPendingByLead(1)).rejects.toThrow(
                    'db down',
                );
            });
        });

        describe('list', () => {
            it('should map records with and without relations', async () => {
                prismaService.actividad.findMany.mockResolvedValue([
                    prismaRecord({
                        lead: {
                            servicioInteres: 'Consultoría',
                            estado: 'EN_PROSPECTO',
                        },
                        responsable: { nombres: 'Carlos', apellidos: 'López' },
                    }),
                    prismaRecord({
                        id: 2,
                        lead: null,
                        responsable: null,
                    }),
                ]);

                const result = await repository.list({ page: 2, limit: 5 });

                expect(result).toHaveLength(2);
                expect(result[0].leadServicioInteres).toBe('Consultoría');
                expect(result[1].leadServicioInteres).toBe('');
                expect(prismaService.actividad.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({ skip: 5, take: 5 }),
                );
            });

            it('should use default pagination and drop invalid estado/tipo filters', async () => {
                prismaService.actividad.findMany.mockResolvedValue([]);

                await repository.list({
                    estado: 'NO_EXISTE',
                    tipo: 'NO_EXISTE',
                });

                expect(prismaService.actividad.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        skip: 0,
                        take: 10,
                        where: { deletedAt: null },
                    }),
                );
            });

            it('should build where with only fechaInicio (gte)', async () => {
                prismaService.actividad.findMany.mockResolvedValue([]);
                const fechaInicio = new Date('2026-06-01T00:00:00.000Z');

                await repository.list({ fechaInicio });

                expect(prismaService.actividad.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: {
                            deletedAt: null,
                            fechaInicio: { gte: fechaInicio },
                        },
                    }),
                );
            });

            it('should build where with only fechaFin (lte)', async () => {
                prismaService.actividad.findMany.mockResolvedValue([]);
                const fechaFin = new Date('2026-06-30T23:59:59.000Z');

                await repository.list({ fechaFin });

                expect(prismaService.actividad.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: {
                            deletedAt: null,
                            fechaInicio: { lte: fechaFin },
                        },
                    }),
                );
            });

            it('should propagate prisma errors', async () => {
                prismaService.actividad.findMany.mockRejectedValue(
                    new Error('list failed'),
                );

                await expect(repository.list()).rejects.toThrow('list failed');
            });
        });

        describe('count', () => {
            it('should count using the built where clause', async () => {
                prismaService.actividad.count.mockResolvedValue(3);

                const result = await repository.count({ idLead: 1 });

                expect(result).toBe(3);
                expect(prismaService.actividad.count).toHaveBeenCalledWith({
                    where: { deletedAt: null, idLead: 1 },
                });
            });

            it('should propagate prisma errors', async () => {
                prismaService.actividad.count.mockRejectedValue(
                    new Error('count failed'),
                );

                await expect(repository.count()).rejects.toThrow('count failed');
            });
        });

        describe('P2003 unknown field handling', () => {
            it('should map P2003 with an unknown field to a generic message', async () => {
                prismaService.actividad.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed on the field: `otroCampo`',
                    ),
                );

                await expect(
                    repository.save(buildNewActividad()),
                ).rejects.toThrow(/otroCampo/);
            });

            it('should map P2003 without a matchable field to "desconocido"', async () => {
                prismaService.actividad.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed, no field info',
                    ),
                );

                await expect(
                    repository.save(buildNewActividad()),
                ).rejects.toThrow(/desconocido/);
            });
        });
    });
});
