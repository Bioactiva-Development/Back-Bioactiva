import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaLeadRepository } from '@/modules/leads/infrastructure/persistance/prisma-lead.repository';
import { Lead } from '@/modules/leads/domain/entities/lead';
import { LeadState } from '@/modules/leads/domain/enums/lead-state';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';

describe('Leads module', () => {
    describe('PrismaLeadRepository', () => {
        let repository: PrismaLeadRepository;
        let prismaService: any;

        const buildLead = () =>
            new Lead(
                null,
                'org-1',
                null,
                LeadState.EN_PROSPECTO,
                'Consultoría',
                null,
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

        beforeEach(() => {
            prismaService = {
                lead: {
                    create: jest.fn(),
                    update: jest.fn(),
                    findFirst: jest.fn(),
                    findMany: jest.fn(),
                    count: jest.fn(),
                },
            };

            repository = new PrismaLeadRepository(prismaService);
        });

        describe('save', () => {
            it('should create a new lead when id is null', async () => {
                const lead = buildLead();
                const prismaResponse = {
                    id: 1,
                    idOrg: 'org-1',
                    idContacto: null,
                    estado: 'EN_PROSPECTO',
                    servicioInteres: 'Consultoría',
                    comentarios: null,
                    desafioOportunidad: null,
                    notasContacto: null,
                    idEncargado: 1,
                    canalCaptacion: null,
                    idAuthor: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    ultimoCambioEstado: new Date(),
                };
                prismaService.lead.create.mockResolvedValue(prismaResponse);

                const result = await repository.save(lead);

                expect(result.id).toBe(1);
                expect(prismaService.lead.create).toHaveBeenCalled();
            });

            it('should update an existing lead when id is not null', async () => {
                const lead = new Lead(
                    1,
                    'org-1',
                    null,
                    LeadState.OFERTADO,
                    'Consultoría',
                    null,
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
                const prismaResponse = {
                    id: 1,
                    idOrg: 'org-1',
                    idContacto: null,
                    estado: 'OFERTADO',
                    servicioInteres: 'Consultoría',
                    comentarios: null,
                    desafioOportunidad: null,
                    notasContacto: null,
                    idEncargado: 1,
                    canalCaptacion: null,
                    idAuthor: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    ultimoCambioEstado: new Date(),
                };
                prismaService.lead.update.mockResolvedValue(prismaResponse);

                const result = await repository.save(lead);

                expect(result.estado).toBe(LeadState.OFERTADO);
                expect(prismaService.lead.update).toHaveBeenCalled();
            });

            it('should persist deletedAt when soft deleting an existing lead', async () => {
                const deletedAt = new Date('2026-01-15T10:30:00.000Z');
                const lead = new Lead(
                    1,
                    'org-1',
                    null,
                    LeadState.EN_PROSPECTO,
                    'Consultoría',
                    null,
                    null,
                    null,
                    1,
                    null,
                    1,
                    new Date(),
                    new Date(),
                    deletedAt,
                    new Date(),
                );
                prismaService.lead.update.mockResolvedValue({
                    id: 1,
                    idOrg: 'org-1',
                    idContacto: null,
                    estado: 'EN_PROSPECTO',
                    servicioInteres: 'Consultoría',
                    comentarios: null,
                    desafioOportunidad: null,
                    notasContacto: null,
                    idEncargado: 1,
                    canalCaptacion: null,
                    idAuthor: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt,
                    ultimoCambioEstado: new Date(),
                });

                await repository.save(lead);

                expect(prismaService.lead.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: 1 },
                        data: expect.objectContaining({ deletedAt }),
                    }),
                );
            });

            it('should disconnect contact when updating a lead without contact', async () => {
                const lead = new Lead(
                    1,
                    'org-1',
                    null,
                    LeadState.EN_PROSPECTO,
                    'Consultoría',
                    null,
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
                prismaService.lead.update.mockResolvedValue({
                    id: 1,
                    idOrg: 'org-1',
                    idContacto: null,
                    estado: 'EN_PROSPECTO',
                    servicioInteres: 'Consultoría',
                    comentarios: null,
                    desafioOportunidad: null,
                    notasContacto: null,
                    idEncargado: 1,
                    canalCaptacion: null,
                    idAuthor: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    ultimoCambioEstado: new Date(),
                });

                await repository.save(lead);

                expect(prismaService.lead.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            contacto: { disconnect: true },
                        }),
                    }),
                );
            });

            it('should connect contact when updating a lead with contact', async () => {
                const lead = new Lead(
                    1,
                    'org-1',
                    42,
                    LeadState.EN_PROSPECTO,
                    'Consultoría',
                    null,
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
                prismaService.lead.update.mockResolvedValue({
                    id: 1,
                    idOrg: 'org-1',
                    idContacto: 42,
                    estado: 'EN_PROSPECTO',
                    servicioInteres: 'Consultoría',
                    comentarios: null,
                    desafioOportunidad: null,
                    notasContacto: null,
                    idEncargado: 1,
                    canalCaptacion: null,
                    idAuthor: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    ultimoCambioEstado: new Date(),
                });

                await repository.save(lead);

                expect(prismaService.lead.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            contacto: { connect: { id: 42 } },
                        }),
                    }),
                );
            });
        });

        describe('saveWithRelations', () => {
            it('should return enriched lead after save', async () => {
                const lead = buildLead();
                const createdRecord = {
                    id: 1,
                    idOrg: 'org-1',
                    idContacto: null,
                    estado: 'EN_PROSPECTO',
                    servicioInteres: 'Consultoría',
                    comentarios: null,
                    desafioOportunidad: null,
                    notasContacto: null,
                    idEncargado: 1,
                    canalCaptacion: null,
                    idAuthor: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    ultimoCambioEstado: new Date(),
                };
                prismaService.lead.create.mockResolvedValue(createdRecord);

                const enrichedRecord = {
                    ...createdRecord,
                    organizacion: { nombre: 'Bioactiva SAC' },
                    encargado: { nombres: 'Carlos', apellidos: 'López' },
                    contacto: null,
                };
                prismaService.lead.findFirst.mockResolvedValue(enrichedRecord);

                const result = await repository.saveWithRelations(lead);

                expect(result.lead.id).toBe(1);
                expect(result.organizationName).toBe('Bioactiva SAC');
                expect(result.encargadoNombre).toBe('Carlos');
                expect(result.encargadoApellidos).toBe('López');
                expect(result.contactName).toBeNull();
            });

            it('should throw when re-fetch after save returns null', async () => {
                const lead = buildLead();
                const createdRecord = {
                    id: 1,
                    idOrg: 'org-1',
                    idContacto: null,
                    estado: 'EN_PROSPECTO',
                    servicioInteres: 'Consultoría',
                    comentarios: null,
                    desafioOportunidad: null,
                    notasContacto: null,
                    idEncargado: 1,
                    canalCaptacion: null,
                    idAuthor: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    ultimoCambioEstado: new Date(),
                };
                prismaService.lead.create.mockResolvedValue(createdRecord);
                prismaService.lead.findFirst.mockResolvedValue(null);

                await expect(
                    repository.saveWithRelations(lead),
                ).rejects.toThrow(LeadNotFoundException);
            });
        });

        describe('list', () => {
            const baseRecord = {
                id: 1,
                idOrg: 'org-1',
                idContacto: null,
                estado: 'EN_PROSPECTO',
                servicioInteres: 'Consultoría',
                comentarios: null,
                desafioOportunidad: null,
                notasContacto: null,
                idEncargado: 1,
                canalCaptacion: null,
                idAuthor: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                ultimoCambioEstado: new Date(),
                organizacion: { nombre: 'Bioactiva SAC' },
                encargado: { nombres: 'Carlos', apellidos: 'López' },
                contacto: null,
            };

            it('should apply a case-insensitive search on servicioInteres', async () => {
                prismaService.lead.findMany.mockResolvedValue([]);

                await repository.list({ search: 'consultoría' });

                expect(prismaService.lead.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            servicioInteres: {
                                contains: 'consultoría',
                                mode: 'insensitive',
                            },
                        }),
                    }),
                );
            });

            it('should compute ROJO alert when the lead has an overdue pending activity', async () => {
                const overdue = new Date(Date.now() - 24 * 60 * 60 * 1000);
                prismaService.lead.findMany.mockResolvedValue([
                    { ...baseRecord, actividades: [{ fechaFin: overdue }] },
                ]);

                const result = await repository.list();

                expect(result[0].activityAlert).toBe('ROJO');
            });

            it('should compute VERDE alert when the lead has no pending activities', async () => {
                prismaService.lead.findMany.mockResolvedValue([
                    { ...baseRecord, actividades: [] },
                ]);

                const result = await repository.list();

                expect(result[0].activityAlert).toBe('VERDE');
            });

            it('should filter by leads with upcoming/overdue activities when requested', async () => {
                prismaService.lead.findMany.mockResolvedValue([]);

                await repository.list({ conActividadesPorVencer: true });

                expect(prismaService.lead.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            actividades: {
                                some: {
                                    deletedAt: null,
                                    estado: 'PENDIENTE',
                                    fechaFin: { lte: expect.any(Date) },
                                },
                            },
                        }),
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

            it('should map P2003 idOrg to LeadNotFoundException', async () => {
                const prismaError = createPrismaError(
                    'P2003',
                    'Foreign key constraint failed on the field: `idOrg`',
                );
                prismaService.lead.create.mockRejectedValue(prismaError);

                await expect(repository.save(buildLead())).rejects.toThrow(
                    LeadNotFoundException,
                );
            });

            it('should map P2003 idContacto to LeadNotFoundException', async () => {
                const prismaError = createPrismaError(
                    'P2003',
                    'Foreign key constraint failed on the field: `idContacto`',
                );
                prismaService.lead.create.mockRejectedValue(prismaError);

                await expect(repository.save(buildLead())).rejects.toThrow(
                    LeadNotFoundException,
                );
            });

            it('should map P2003 idEncargado to LeadNotFoundException', async () => {
                const prismaError = createPrismaError(
                    'P2003',
                    'Foreign key constraint failed on the field: `idEncargado`',
                );
                prismaService.lead.create.mockRejectedValue(prismaError);

                await expect(repository.save(buildLead())).rejects.toThrow(
                    LeadNotFoundException,
                );
            });

            it('should map P2025 on update to LeadNotFoundException', async () => {
                const prismaError = createPrismaError(
                    'P2025',
                    'Record to update not found.',
                );
                const existingLead = new Lead(
                    999,
                    'org-1',
                    null,
                    LeadState.EN_PROSPECTO,
                    'Consultoría',
                    null,
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
                prismaService.lead.update.mockRejectedValue(prismaError);

                await expect(repository.save(existingLead)).rejects.toThrow(
                    LeadNotFoundException,
                );
            });

            it('should re-throw unknown Prisma errors', async () => {
                const prismaError = createPrismaError(
                    'P2000',
                    'Value too long for column.',
                );
                prismaService.lead.create.mockRejectedValue(prismaError);

                await expect(repository.save(buildLead())).rejects.toThrow(
                    prismaError,
                );
            });

            it('should re-throw non-Prisma errors', async () => {
                const genericError = new Error('Network error');
                prismaService.lead.create.mockRejectedValue(genericError);

                await expect(repository.save(buildLead())).rejects.toThrow(
                    genericError,
                );
            });
        });
    });
});
