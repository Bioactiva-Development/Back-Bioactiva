import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaLeadRepository } from '@/modules/leads/infrastructure/persistance/prisma-lead.repository';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';

describe('Leads module', () => {
    describe('PrismaLeadRepository (additional coverage)', () => {
        let repository: PrismaLeadRepository;
        let prismaService: any;

        const baseRecord = {
            id: 1,
            idOrg: 'org-1',
            idContacto: null,
            estado: 'EN_PROSPECTO',
            servicioInteres: 'Consultoría',
            comentarios: null,
            desafioOportunidad: null,
            idEncargado: 1,
            canalCaptacion: null,
            idAuthor: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            ultimoCambioEstado: new Date(),
        };

        const buildLead = () =>
            new Lead(
                null,
                'org-1',
                null,
                LeadState.EN_PROSPECTO,
                'Consultoría',
                null,
                null,
                1,
                null,
                1,
                new Date(),
                new Date(),
                null,
                new Date(),
            );

        function createPrismaError(code: string, message: string) {
            const error = new Error(message) as any;
            error.code = code;
            error.name = 'PrismaClientKnownRequestError';
            return error;
        }

        beforeEach(() => {
            prismaService = {
                lead: {
                    create: jest.fn(),
                    update: jest.fn(),
                    findFirst: jest.fn(),
                    findMany: jest.fn(),
                    count: jest.fn(),
                },
                actividad: {
                    count: jest.fn(),
                },
                $queryRaw: jest.fn(),
            };

            repository = new PrismaLeadRepository(prismaService);
        });

        describe('findById', () => {
            it('returns the mapped domain lead when found', async () => {
                prismaService.lead.findFirst.mockResolvedValue(baseRecord);

                const result = await repository.findById(1);

                expect(result?.id).toBe(1);
                expect(prismaService.lead.findFirst).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            id: 1,
                            deletedAt: null,
                            organizacion: { deletedAt: null },
                        }),
                    }),
                );
            });

            it('returns null when no lead is found', async () => {
                prismaService.lead.findFirst.mockResolvedValue(null);

                const result = await repository.findById(99);

                expect(result).toBeNull();
            });

            it('maps a Prisma error through handlePrismaError', async () => {
                prismaService.lead.findFirst.mockRejectedValue(
                    createPrismaError('P2025', 'Record not found.'),
                );

                await expect(repository.findById(1)).rejects.toThrow(
                    LeadNotFoundException,
                );
            });
        });

        describe('findByIdWithRelations', () => {
            it('returns null when no lead is found', async () => {
                prismaService.lead.findFirst.mockResolvedValue(null);

                const result = await repository.findByIdWithRelations(99);

                expect(result).toBeNull();
            });

            it('maps a Prisma error through handlePrismaError', async () => {
                prismaService.lead.findFirst.mockRejectedValue(
                    createPrismaError('P2025', 'Record not found.'),
                );

                await expect(
                    repository.findByIdWithRelations(1),
                ).rejects.toThrow(LeadNotFoundException);
            });
        });

        describe('buildWhere (estado / idOrg / idEncargado filters)', () => {
            it('applies estado, idOrg and idEncargado filters', async () => {
                prismaService.lead.findMany.mockResolvedValue([]);

                await repository.list({
                    estado: LeadState.OFERTADO,
                    idOrg: 'org-1',
                    idEncargado: 7,
                });

                expect(prismaService.lead.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            estado: 'OFERTADO',
                            idOrg: 'org-1',
                            idEncargado: 7,
                        }),
                    }),
                );
            });

            it('ignores an unknown estado value (parseLeadState returns undefined)', async () => {
                prismaService.lead.findMany.mockResolvedValue([]);

                await repository.list({ estado: 'NO_EXISTE' as LeadState });

                const callArg = prismaService.lead.findMany.mock.calls[0][0];
                expect(callArg.where.estado).toBeUndefined();
            });

            it('filters by createdAt with only fechaDesde provided', async () => {
                prismaService.lead.findMany.mockResolvedValue([]);
                const fechaDesde = new Date('2022-01-01T00:00:00.000Z');

                await repository.list({ fechaDesde });

                expect(prismaService.lead.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            createdAt: { gte: fechaDesde },
                        }),
                    }),
                );
            });

            it('filters by createdAt with only fechaHasta provided', async () => {
                prismaService.lead.findMany.mockResolvedValue([]);
                const fechaHasta = new Date('2026-06-11T00:00:00.000Z');

                await repository.list({ fechaHasta });

                expect(prismaService.lead.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            createdAt: { lte: fechaHasta },
                        }),
                    }),
                );
            });
        });

        describe('mapToLeadWithRelations null-relation branches', () => {
            it('falls back to empty strings and null contact when relations are null', async () => {
                prismaService.lead.findMany.mockResolvedValue([
                    {
                        ...baseRecord,
                        organizacion: null,
                        encargado: null,
                        contacto: null,
                        actividades: [],
                    },
                ]);

                const result = await repository.list();

                expect(result[0].organizationName).toBe('');
                expect(result[0].encargadoNombre).toBe('');
                expect(result[0].encargadoApellidos).toBe('');
                expect(result[0].contactName).toBeNull();
            });

            it('builds a contact name and trims a missing apellido', async () => {
                prismaService.lead.findMany.mockResolvedValue([
                    {
                        ...baseRecord,
                        organizacion: { nombre: 'Bioactiva SAC' },
                        encargado: { nombres: 'Carlos', apellidos: 'López' },
                        contacto: { nombres: 'Juan', apellidos: null },
                        actividades: [],
                    },
                ]);

                const result = await repository.list();

                expect(result[0].contactName).toBe('Juan');
            });

            it('defaults activities to an empty list when undefined', async () => {
                prismaService.lead.findMany.mockResolvedValue([
                    {
                        ...baseRecord,
                        organizacion: { nombre: 'Bioactiva SAC' },
                        encargado: { nombres: 'Carlos', apellidos: 'López' },
                        contacto: null,
                    },
                ]);

                const result = await repository.list();

                expect(result[0].activityAlert).toBe('SIN_ACTIVIDADES');
            });
        });

        describe('count', () => {
            it('returns the count for the built where clause', async () => {
                prismaService.lead.count.mockResolvedValue(5);

                const result = await repository.count({ idOrg: 'org-1' });

                expect(result).toBe(5);
                expect(prismaService.lead.count).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({ idOrg: 'org-1' }),
                    }),
                );
            });

            it('maps a Prisma error through handlePrismaError', async () => {
                prismaService.lead.count.mockRejectedValue(
                    createPrismaError('P2025', 'Record not found.'),
                );

                await expect(repository.count()).rejects.toThrow(
                    LeadNotFoundException,
                );
            });
        });

        describe('list error mapping', () => {
            it('maps a Prisma error through handlePrismaError', async () => {
                prismaService.lead.findMany.mockRejectedValue(
                    createPrismaError('P2025', 'Record not found.'),
                );

                await expect(repository.list()).rejects.toThrow(
                    LeadNotFoundException,
                );
            });
        });

        describe('hasPendingActivities', () => {
            it('returns true when there are pending activities', async () => {
                prismaService.actividad.count.mockResolvedValue(2);

                const result = await repository.hasPendingActivities(1);

                expect(result).toBe(true);
                expect(prismaService.actividad.count).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            idLead: 1,
                            deletedAt: null,
                            estado: 'PENDIENTE',
                        }),
                    }),
                );
            });

            it('returns false when there are no pending activities', async () => {
                prismaService.actividad.count.mockResolvedValue(0);

                const result = await repository.hasPendingActivities(1);

                expect(result).toBe(false);
            });

            it('maps a Prisma error through handlePrismaError', async () => {
                prismaService.actividad.count.mockRejectedValue(
                    createPrismaError('P2025', 'Record not found.'),
                );

                await expect(
                    repository.hasPendingActivities(1),
                ).rejects.toThrow(LeadNotFoundException);
            });
        });

        describe('P2003 foreign key mapping (remaining fields)', () => {
            it('maps P2003 idAuthor to LeadNotFoundException', async () => {
                prismaService.lead.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed on the field: `idAuthor`',
                    ),
                );

                await expect(repository.save(buildLead())).rejects.toThrow(
                    LeadNotFoundException,
                );
            });

            it('maps P2003 on an unrecognized field to a generic LeadNotFoundException', async () => {
                prismaService.lead.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed on the field: `idDesconocido`',
                    ),
                );

                await expect(repository.save(buildLead())).rejects.toThrow(
                    LeadNotFoundException,
                );
            });

            it('maps P2003 with no matchable field to a generic LeadNotFoundException', async () => {
                prismaService.lead.create.mockRejectedValue(
                    createPrismaError(
                        'P2003',
                        'Foreign key constraint failed.',
                    ),
                );

                await expect(repository.save(buildLead())).rejects.toThrow(
                    LeadNotFoundException,
                );
            });
        });

        describe('P2025 mapping without a leadId context', () => {
            it('throws the generic "Registro no encontrado" message', async () => {
                prismaService.lead.findMany.mockRejectedValue(
                    createPrismaError('P2025', 'Record not found.'),
                );

                await expect(repository.list()).rejects.toThrow(
                    'Registro no encontrado',
                );
            });
        });
    });
});
