import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaActivityRepository } from '@/modules/activities/infrastructure/persistance/prisma-activity.repository';
import { Actividad } from '@/modules/activities/domain/entities/actividad';
import { EstadoActividad } from '@/modules/activities/domain/enums/estado-actividad';
import { TipoActividad } from '@/modules/activities/domain/enums/tipo-actividad';
import { ActivityNotFoundException } from '@/modules/activities/domain/exceptions/activity-not-found.exception';

/**
 * PrismaActivityRepository
 * ------------------------
 * Verifica la persistencia con un PrismaService mockeado:
 * - save(): crea cuando id === 0, actualiza en otro caso y persiste deletedAt (soft delete).
 * - saveWithRelations(): devuelve la actividad enriquecida (lead + responsable) y lanza
 *   ActivityNotFoundException si el re-fetch posterior es null.
 * - findPendingByLead(): consulta solo PENDIENTE no eliminadas (RN-004).
 * - list(): arma el where con filtros y rango de fechas, excluyendo eliminadas.
 * - Mapeo de errores Prisma: P2003 (idLead/idResponsable) y P2025 → ActivityNotFoundException;
 *   otros errores se relanzan tal cual.
 */
describe('Activities module', () => {
    describe('PrismaActivityRepository', () => {
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

        describe('save', () => {
            it('should create a new activity when id is 0', async () => {
                prismaService.actividad.create.mockResolvedValue(prismaRecord());

                const result = await repository.save(buildNewActividad());

                expect(result.id).toBe(1);
                expect(prismaService.actividad.create).toHaveBeenCalled();
            });

            it('should update an existing activity when id is not 0', async () => {
                const existing = new Actividad(
                    1,
                    'Llamada',
                    new Date('2026-06-01T10:00:00.000Z'),
                    new Date('2026-06-01T11:00:00.000Z'),
                    TipoActividad.LLAMADA,
                    EstadoActividad.REALIZADA,
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
                prismaService.actividad.update.mockResolvedValue(
                    prismaRecord({ estado: 'REALIZADA' }),
                );

                const result = await repository.save(existing);

                expect(result.estado).toBe(EstadoActividad.REALIZADA);
                expect(prismaService.actividad.update).toHaveBeenCalled();
            });

            it('should persist deletedAt when soft deleting', async () => {
                const deletedAt = new Date('2026-06-02T10:00:00.000Z');
                const activity = new Actividad(
                    1,
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
                    deletedAt,
                );
                prismaService.actividad.update.mockResolvedValue(
                    prismaRecord({ deletedAt }),
                );

                await repository.save(activity);

                expect(prismaService.actividad.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: 1 },
                        data: expect.objectContaining({ deletedAt }),
                    }),
                );
            });
        });

        describe('saveWithRelations', () => {
            it('should return enriched activity after save', async () => {
                prismaService.actividad.create.mockResolvedValue(prismaRecord());
                prismaService.actividad.findFirst.mockResolvedValue(
                    prismaRecord({
                        lead: {
                            servicioInteres: 'Consultoría',
                            estado: 'EN_PROSPECTO',
                        },
                        responsable: { nombres: 'Carlos', apellidos: 'López' },
                    }),
                );

                const result = await repository.saveWithRelations(
                    buildNewActividad(),
                );

                expect(result.activity.id).toBe(1);
                expect(result.leadServicioInteres).toBe('Consultoría');
                expect(result.leadEstado).toBe('EN_PROSPECTO');
                expect(result.responsableNombre).toBe('Carlos');
                expect(result.responsableApellidos).toBe('López');
            });

            it('should throw when re-fetch after save returns null', async () => {
                prismaService.actividad.create.mockResolvedValue(prismaRecord());
                prismaService.actividad.findFirst.mockResolvedValue(null);

                await expect(
                    repository.saveWithRelations(buildNewActividad()),
                ).rejects.toThrow(ActivityNotFoundException);
            });
        });

        describe('findPendingByLead', () => {
            it('should query pending non-deleted activities for the lead', async () => {
                prismaService.actividad.findFirst.mockResolvedValue(null);

                const result = await repository.findPendingByLead(7);

                expect(result).toBeNull();
                expect(prismaService.actividad.findFirst).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: {
                            idLead: 7,
                            estado: 'PENDIENTE',
                            deletedAt: null,
                        },
                    }),
                );
            });

            it('should return the pending activity when found', async () => {
                prismaService.actividad.findFirst.mockResolvedValue(
                    prismaRecord(),
                );

                const result = await repository.findPendingByLead(1);

                expect(result?.estado).toBe(EstadoActividad.PENDIENTE);
            });
        });

        describe('list', () => {
            it('should build where clause with filters and date range', async () => {
                prismaService.actividad.findMany.mockResolvedValue([]);

                const fechaInicio = new Date('2026-06-01T00:00:00.000Z');
                const fechaFin = new Date('2026-06-30T23:59:59.000Z');
                await repository.list({
                    idLead: 1,
                    idResponsable: 5,
                    estado: 'PENDIENTE',
                    tipo: 'LLAMADA',
                    fechaInicio,
                    fechaFin,
                });

                expect(prismaService.actividad.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: {
                            deletedAt: null,
                            idLead: 1,
                            idResponsable: 5,
                            estado: 'PENDIENTE',
                            tipo: 'LLAMADA',
                            fechaInicio: { gte: fechaInicio, lte: fechaFin },
                        },
                    }),
                );
            });
        });

        describe('Prisma error mapping', () => {
            function createPrismaError(code: string, message: string) {
                const error = new Error(message) as any;
                error.code = code;
                error.name = 'PrismaClientKnownRequestError';
                return error;
            }

            it('should map P2003 idLead to ActivityNotFoundException', async () => {
                prismaService.actividad.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed on the field: `idLead`',
                    ),
                );

                await expect(
                    repository.save(buildNewActividad()),
                ).rejects.toThrow(ActivityNotFoundException);
            });

            it('should map P2003 idResponsable to ActivityNotFoundException', async () => {
                prismaService.actividad.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed on the field: `idResponsable`',
                    ),
                );

                await expect(
                    repository.save(buildNewActividad()),
                ).rejects.toThrow(ActivityNotFoundException);
            });

            it('should map P2025 to ActivityNotFoundException', async () => {
                const existing = new Actividad(
                    999,
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
                prismaService.actividad.update.mockRejectedValue(
                    createPrismaError('P2025', 'Record to update not found.'),
                );

                await expect(repository.save(existing)).rejects.toThrow(
                    ActivityNotFoundException,
                );
            });

            it('should re-throw unknown Prisma errors', async () => {
                const prismaError = createPrismaError(
                    'P2000',
                    'Value too long for column.',
                );
                prismaService.actividad.create.mockRejectedValue(prismaError);

                await expect(
                    repository.save(buildNewActividad()),
                ).rejects.toThrow(prismaError);
            });

            it('should re-throw non-Prisma errors', async () => {
                const genericError = new Error('Network error');
                prismaService.actividad.create.mockRejectedValue(genericError);

                await expect(
                    repository.save(buildNewActividad()),
                ).rejects.toThrow(genericError);
            });
        });
    });
});
