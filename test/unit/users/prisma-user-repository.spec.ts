import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaUserRepository } from '@/modules/users/infrastructure/persistance/prisma-user.repository';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Users module', () => {
    describe('PrismaUserRepository', () => {
        let repository: PrismaUserRepository;
        let mockPrisma: any;

        const createdAt = new Date('2024-01-01T00:00:00Z');
        const updatedAt = new Date('2024-01-02T00:00:00Z');

        const mockRecord = {
            id: 7,
            nombres: 'Ana',
            apellidos: 'García',
            correo: 'ana@example.com',
            password: 'hashed-password',
            createdAt,
            updatedAt,
            rol: 'TRABAJADOR',
            estado: 'ACTIVO',
            tokenVersion: 0,
        };

        const buildUser = (id: number | null) =>
            new User(
                id,
                'Ana',
                'García',
                'ana@example.com',
                'hashed-password',
                createdAt,
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                updatedAt,
            );

        beforeEach(() => {
            mockPrisma = {
                usuario: {
                    findUnique: jest.fn(),
                    findMany: jest.fn(),
                    create: jest.fn(),
                    update: jest.fn(),
                    count: jest.fn(),
                },
            };
            repository = new PrismaUserRepository(mockPrisma as any);
        });

        describe('findByCorreo', () => {
            it('returns the mapped user when found', async () => {
                mockPrisma.usuario.findUnique.mockResolvedValue(mockRecord);

                const result = await repository.findByCorreo('ana@example.com');

                expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
                    where: { correo: 'ana@example.com' },
                });
                expect(result).toBeInstanceOf(User);
                expect(result?.correo).toBe('ana@example.com');
            });

            it('returns null when not found', async () => {
                mockPrisma.usuario.findUnique.mockResolvedValue(null);

                const result = await repository.findByCorreo('none@example.com');

                expect(result).toBeNull();
            });
        });

        describe('findByCorreos', () => {
            it('returns an empty array when no correos are provided', async () => {
                const result = await repository.findByCorreos([]);

                expect(result).toEqual([]);
                expect(mockPrisma.usuario.findMany).not.toHaveBeenCalled();
            });

            it('maps every record found by correo', async () => {
                mockPrisma.usuario.findMany.mockResolvedValue([mockRecord]);

                const result = await repository.findByCorreos([
                    'ana@example.com',
                ]);

                expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith({
                    where: { correo: { in: ['ana@example.com'] } },
                });
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(User);
            });
        });

        describe('findById', () => {
            it('returns the mapped user when found', async () => {
                mockPrisma.usuario.findUnique.mockResolvedValue(mockRecord);

                const result = await repository.findById(7);

                expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
                    where: { id: 7 },
                });
                expect(result?.id).toBe(7);
            });

            it('returns null when not found', async () => {
                mockPrisma.usuario.findUnique.mockResolvedValue(null);

                const result = await repository.findById(99);

                expect(result).toBeNull();
            });
        });

        describe('save', () => {
            it('creates a new record when the user has no id', async () => {
                mockPrisma.usuario.create.mockResolvedValue(mockRecord);

                const result = await repository.save(buildUser(null));

                expect(mockPrisma.usuario.create).toHaveBeenCalled();
                expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
                expect(result).toBeInstanceOf(User);
            });

            it('updates the record when the user already has an id', async () => {
                mockPrisma.usuario.update.mockResolvedValue(mockRecord);

                const result = await repository.save(buildUser(7));

                expect(mockPrisma.usuario.update).toHaveBeenCalledWith(
                    expect.objectContaining({ where: { id: 7 } }),
                );
                expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
                expect(result).toBeInstanceOf(User);
            });
        });

        describe('count', () => {
            it('counts administrators mapping the role to prisma', async () => {
                mockPrisma.usuario.count.mockResolvedValue(3);

                const result = await repository.count({
                    where: { role: UserRole.ADMINISTRADOR },
                });

                expect(mockPrisma.usuario.count).toHaveBeenCalledWith({
                    where: { rol: 'ADMINISTRADOR' },
                });
                expect(result).toBe(3);
            });

            it('counts workers for any non-administrator role', async () => {
                mockPrisma.usuario.count.mockResolvedValue(5);

                const result = await repository.count({
                    where: { role: UserRole.TRABAJADOR },
                });

                expect(mockPrisma.usuario.count).toHaveBeenCalledWith({
                    where: { rol: 'TRABAJADOR' },
                });
                expect(result).toBe(5);
            });
        });

        describe('findAll', () => {
            it('uses default pagination and an empty filter when no params are given', async () => {
                mockPrisma.usuario.findMany.mockResolvedValue([mockRecord]);

                const result = await repository.findAll();

                expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith({
                    where: {},
                    orderBy: { createdAt: 'desc' },
                    skip: 0,
                    take: 10,
                });
                expect(result).toHaveLength(1);
            });

            it('builds search, role and estado filters and paginates', async () => {
                mockPrisma.usuario.findMany.mockResolvedValue([]);

                await repository.findAll({
                    search: 'ana',
                    role: UserRole.TRABAJADOR,
                    estado: UserState.ACTIVO,
                    page: 3,
                    limit: 5,
                });

                expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith({
                    where: {
                        OR: [
                            {
                                nombres: {
                                    contains: 'ana',
                                    mode: 'insensitive',
                                },
                            },
                            {
                                correo: {
                                    contains: 'ana',
                                    mode: 'insensitive',
                                },
                            },
                        ],
                        rol: 'TRABAJADOR',
                        estado: 'ACTIVO',
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: 10,
                    take: 5,
                });
            });
        });

        describe('countAll', () => {
            it('counts with an empty filter when no params are given', async () => {
                mockPrisma.usuario.count.mockResolvedValue(0);

                const result = await repository.countAll();

                expect(mockPrisma.usuario.count).toHaveBeenCalledWith({
                    where: {},
                });
                expect(result).toBe(0);
            });

            it('counts applying the search, role and estado filters', async () => {
                mockPrisma.usuario.count.mockResolvedValue(2);

                const result = await repository.countAll({
                    search: 'gar',
                    role: UserRole.ADMINISTRADOR,
                    estado: UserState.SUSPENDIDO,
                });

                expect(mockPrisma.usuario.count).toHaveBeenCalledWith({
                    where: {
                        OR: [
                            {
                                nombres: {
                                    contains: 'gar',
                                    mode: 'insensitive',
                                },
                            },
                            {
                                correo: {
                                    contains: 'gar',
                                    mode: 'insensitive',
                                },
                            },
                        ],
                        rol: 'ADMINISTRADOR',
                        estado: 'SUSPENDIDO',
                    },
                });
                expect(result).toBe(2);
            });
        });

        describe('findEnabled', () => {
            it('queries active users ordered by name and maps them', async () => {
                mockPrisma.usuario.findMany.mockResolvedValue([mockRecord]);

                const result = await repository.findEnabled();

                expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith({
                    where: { estado: 'ACTIVO' },
                    orderBy: [{ nombres: 'asc' }, { apellidos: 'asc' }],
                });
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(User);
            });
        });
    });
});
