import { describe, expect, it, beforeEach } from '@jest/globals';
import { PrismaOrganizationRepository } from '@/modules/organizations/infrastructure/persistance/prisma-organization.repository';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { PrismaService } from '@/modules/common/prisma/prisma.service';

describe('Organizations module', () => {
    /**
     * PrismaOrganizationRepository
     * ----------
     * Responsable de:
     * - persistir organizaciones en la base de datos
     * - buscar organizaciones por ID y RUC
     * - mapear entre entidades de dominio y modelos Prisma
     * - manejar operaciones create/update
     */
    // STATUS: Implementación completa (CRUD operations).
    describe('PrismaOrganizationRepository', () => {
        let repository: PrismaOrganizationRepository;
        let mockPrisma: Partial<PrismaService>;

        const mockOrgData = {
            id: 'org-1',
            codigoCliente: 'CLI-001',
            nombre: 'Tech Corp Peru',
            nombreComercial: 'TechCorp',
            subArea: 'Technology',
            ruc: '20123456789',
            tipo: 'EMPRESA_NACIONAL' as const,
            linkedin: 'https://linkedin.com/company/techcorp',
            ubicacion: 'Lima, Peru',
            sector: 'TECNOLOGIA' as const,
            tamano: 'GRANDE' as const,
            actividadEconomica: 'Software Development',
            alianzasEstrategicas: 'Microsoft, Google',
            idContactoActivo: 1,
            idAuthor: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            deletedAt: null,
        };

        beforeEach(() => {
            mockPrisma = {
                organizacion: {
                    create: jest.fn(),
                    update: jest.fn(),
                    findUnique: jest.fn(),
                    findFirst: jest.fn(),
                    findMany: jest.fn(),
                    updateMany: jest.fn(),
                    count: jest.fn(),
                },
                contacto: {
                    updateMany: jest.fn(),
                },
                $transaction: jest.fn(),
            };

            repository = new PrismaOrganizationRepository(mockPrisma as any);
        });

        describe('save', () => {
            it('should create new organization when ID is empty', async () => {
                const org = new Organization(
                    '',
                    'CLI-001',
                    'Tech Corp Peru',
                    'TechCorp',
                    'Technology',
                    '20123456789',
                    EnterpriseType.EMPRESA_NACIONAL,
                    'https://linkedin.com/company/techcorp',
                    'Lima, Peru',
                    Sector.TECNOLOGIA,
                    Size.GRANDE,
                    'Software Development',
                    'Microsoft, Google',
                    1,
                    1,
                    new Date('2024-01-01'),
                    new Date('2024-01-01'),
                );

                (
                    mockPrisma.organizacion!.create as jest.Mock
                ).mockResolvedValue(mockOrgData);

                const result = await repository.save(org);

                expect(mockPrisma.organizacion!.create).toHaveBeenCalled();
                expect(result.id).toBe('org-1');
                expect(result.ruc).toBe('20123456789');
            });

            it('should update existing organization when ID exists', async () => {
                const org = new Organization(
                    'org-1',
                    'CLI-001',
                    'Tech Corp Peru Updated',
                    'TechCorp',
                    'Technology',
                    '20123456789',
                    EnterpriseType.EMPRESA_NACIONAL,
                    'https://linkedin.com/company/techcorp',
                    'Lima, Peru',
                    Sector.TECNOLOGIA,
                    Size.GRANDE,
                    'Software Development',
                    'Microsoft, Google',
                    1,
                    1,
                    new Date('2024-01-01'),
                    new Date('2024-01-02'),
                );

                (
                    mockPrisma.organizacion!.update as jest.Mock
                ).mockResolvedValue(mockOrgData);

                const result = await repository.save(org);

                expect(mockPrisma.organizacion!.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: 'org-1' },
                    }),
                );
                expect(result.id).toBe('org-1');
            });
        });

        describe('findById', () => {
            it('should return organization when found, excluding soft-deleted', async () => {
                (
                    mockPrisma.organizacion!.findFirst as jest.Mock
                ).mockResolvedValue(mockOrgData);

                const result = await repository.findById('org-1');

                expect(mockPrisma.organizacion!.findFirst).toHaveBeenCalledWith(
                    {
                        where: { id: 'org-1', deletedAt: null },
                    },
                );
                expect(result).not.toBeNull();
                expect(result!.ruc).toBe('20123456789');
            });

            it('should return null when organization not found', async () => {
                (
                    mockPrisma.organizacion!.findFirst as jest.Mock
                ).mockResolvedValue(null);

                const result = await repository.findById('org-nonexistent');

                expect(result).toBeNull();
            });
        });

        describe('softDelete', () => {
            it('should deactivate the organization and expire its contacts in one transaction', async () => {
                const orgUpdateOp = { __op: 'org-update' };
                const contactUpdateOp = { __op: 'contact-update' };
                (mockPrisma.organizacion!.update as jest.Mock).mockReturnValue(
                    orgUpdateOp,
                );
                (mockPrisma.contacto!.updateMany as jest.Mock).mockReturnValue(
                    contactUpdateOp,
                );
                (mockPrisma.$transaction as jest.Mock).mockResolvedValue([]);

                await repository.softDelete('org-1');

                // La organización se marca como desactivada (soft-delete).
                expect(mockPrisma.organizacion!.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: 'org-1' },
                        data: expect.objectContaining({
                            deletedAt: expect.any(Date),
                        }),
                    }),
                );
                // Sus contactos pasan a estado de correo VENCIDO en bloque (sin N+1).
                expect(mockPrisma.contacto!.updateMany).toHaveBeenCalledWith({
                    where: { idOrganizacion: 'org-1' },
                    data: { estado_correo: 'VENCIDO' },
                });
                // Ambas operaciones viajan en la misma transacción atómica.
                expect(mockPrisma.$transaction).toHaveBeenCalledWith([
                    orgUpdateOp,
                    contactUpdateOp,
                ]);
            });
        });

        describe('findByRuc', () => {
            it('should return organization when RUC found', async () => {
                (
                    mockPrisma.organizacion!.findFirst as jest.Mock
                ).mockResolvedValue(mockOrgData);

                const result = await repository.findByRuc('20123456789');

                expect(mockPrisma.organizacion!.findFirst).toHaveBeenCalledWith(
                    {
                        where: { ruc: '20123456789' },
                    },
                );
                expect(result).not.toBeNull();
                expect(result!.id).toBe('org-1');
            });

            it('should return null when RUC not found', async () => {
                (
                    mockPrisma.organizacion!.findFirst as jest.Mock
                ).mockResolvedValue(null);

                const result = await repository.findByRuc('99999999999');

                expect(result).toBeNull();
            });
        });

        describe('findAll', () => {
            it('should return all organizations', async () => {
                const orgs = [
                    mockOrgData,
                    { ...mockOrgData, id: 'org-2', nombre: 'Company 2' },
                ];
                (
                    mockPrisma.organizacion!.findMany as jest.Mock
                ).mockResolvedValue(orgs);

                const result = await repository.findAll();

                expect(mockPrisma.organizacion!.findMany).toHaveBeenCalled();
                expect(result).toHaveLength(2);
            });

            it('should return empty array when no organizations exist', async () => {
                (
                    mockPrisma.organizacion!.findMany as jest.Mock
                ).mockResolvedValue([]);

                const result = await repository.findAll();

                expect(result).toHaveLength(0);
            });

            it('should apply sector, tamano and tipo filters with pagination', async () => {
                (
                    mockPrisma.organizacion!.findMany as jest.Mock
                ).mockResolvedValue([]);

                await repository.findAll({
                    sector: 'TECNOLOGIA',
                    tamano: 'GRANDE',
                    tipo: 'EMPRESA_NACIONAL',
                    page: 2,
                    limit: 5,
                });

                expect(mockPrisma.organizacion!.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: {
                            deletedAt: null,
                            sector: 'TECNOLOGIA',
                            tamano: 'GRANDE',
                            tipo: 'EMPRESA_NACIONAL',
                        },
                        skip: 5,
                        take: 5,
                    }),
                );
            });

            it('should filter by organization name (term) on nombre and nombreComercial', async () => {
                (
                    mockPrisma.organizacion!.findMany as jest.Mock
                ).mockResolvedValue([]);

                await repository.findAll({ term: 'biofarma' });

                expect(mockPrisma.organizacion!.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            deletedAt: null,
                            OR: [
                                {
                                    nombre: {
                                        contains: 'biofarma',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    nombreComercial: {
                                        contains: 'biofarma',
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        }),
                    }),
                );
            });

            it('countAll should count with the same filters (no pagination)', async () => {
                (mockPrisma.organizacion!.count as jest.Mock).mockResolvedValue(
                    3,
                );

                const total = await repository.countAll({ sector: 'SALUD' });

                expect(total).toBe(3);
                expect(mockPrisma.organizacion!.count).toHaveBeenCalledWith({
                    where: { deletedAt: null, sector: 'SALUD' },
                });
            });
        });
    });
});
