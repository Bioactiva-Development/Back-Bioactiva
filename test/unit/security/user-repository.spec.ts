import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaUserRepository } from '@/modules/users/infrastructure/persistance/prisma-user.repository';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Users module', () => {
    /**
     * PrismaUserRepository
     * ----------
     * Responsable de:
     * - persistir usuarios en la base de datos
     * - buscar usuarios por email (correo) y ID
     * - contar usuarios por rol
     * - mapear entre entidades de dominio y modelos Prisma
     * - manejar operaciones create/update
     */
    // STATUS: Implementación completa (CRUD operations).
    describe('PrismaUserRepository', () => {
        let repository: PrismaUserRepository;
        let mockPrismaClient: any;

        const mockUserData = {
            id: 1,
            nombres: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@example.com',
            password: 'hashed_password',
            estado: 'ACTIVO' as const,
            rol: 'ADMINISTRADOR' as const,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };

        beforeEach(() => {
            mockPrismaClient = {
                usuario: {
                    findUnique: jest.fn(),
                    findFirst: jest.fn(),
                    create: jest.fn(),
                    update: jest.fn(),
                    count: jest.fn(),
                    findMany: jest.fn(),
                },
            };

            repository = new PrismaUserRepository(mockPrismaClient);
        });

        describe('findByCorreo', () => {
            it('should return user when email found', async () => {
                (
                    mockPrismaClient.usuario.findUnique as jest.Mock
                ).mockResolvedValue(mockUserData);

                const result =
                    await repository.findByCorreo('juan@example.com');

                expect(
                    mockPrismaClient.usuario.findUnique,
                ).toHaveBeenCalledWith({
                    where: { correo: 'juan@example.com' },
                });
                expect(result).not.toBeNull();
                expect(result!.correo).toBe('juan@example.com');
            });

            it('should return null when email not found', async () => {
                (
                    mockPrismaClient.usuario.findUnique as jest.Mock
                ).mockResolvedValue(null);

                const result = await repository.findByCorreo(
                    'nonexistent@example.com',
                );

                expect(result).toBeNull();
            });
        });

        describe('findById', () => {
            it('should return user when ID found', async () => {
                (
                    mockPrismaClient.usuario.findUnique as jest.Mock
                ).mockResolvedValue(mockUserData);

                const result = await repository.findById(1);

                expect(
                    mockPrismaClient.usuario.findUnique,
                ).toHaveBeenCalledWith({
                    where: { id: 1 },
                });
                expect(result).not.toBeNull();
                expect(result!.id).toBe(1);
            });

            it('should return null when ID not found', async () => {
                (
                    mockPrismaClient.usuario.findUnique as jest.Mock
                ).mockResolvedValue(null);

                const result = await repository.findById(999);

                expect(result).toBeNull();
            });
        });

        describe('save', () => {
            it('should create user with null ID', async () => {
                const newUser = new User(
                    null,
                    'Ana',
                    'García',
                    'ana@example.com',
                    'hashed_pwd',
                    UserState.PENDIENTE,
                    UserRole.TRABAJADOR,
                    new Date(),
                    new Date(),
                );

                const createdUserData = { ...mockUserData, id: 2 };
                (
                    mockPrismaClient.usuario.create as jest.Mock
                ).mockResolvedValue(createdUserData);

                const result = await repository.save(newUser);

                expect(mockPrismaClient.usuario.create).toHaveBeenCalled();
                expect(result.id).toBe(2);
            });

            it('should update user with existing ID', async () => {
                const existingUser = new User(
                    1,
                    'Juan',
                    'Pérez Updated',
                    'juan@example.com',
                    'hashed_pwd',
                    UserState.ACTIVO,
                    UserRole.ADMINISTRADOR,
                    new Date('2024-01-01'),
                    new Date('2024-01-02'),
                );

                (
                    mockPrismaClient.usuario.update as jest.Mock
                ).mockResolvedValue(mockUserData);

                const result = await repository.save(existingUser);

                expect(mockPrismaClient.usuario.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: 1 },
                    }),
                );
                expect(result.id).toBe(1);
            });

            it('should throw error when updating user with null ID', async () => {
                const userWithNullId = new User(
                    null,
                    'Test',
                    'User',
                    'test@example.com',
                    'hashed',
                    UserState.ACTIVO,
                    UserRole.TRABAJADOR,
                    new Date(),
                    new Date(),
                );

                (
                    mockPrismaClient.usuario.create as jest.Mock
                ).mockResolvedValue(mockUserData);

                // First call to create should work
                const result = await repository.save(userWithNullId);
                expect(result).not.toBeNull();
            });
        });

        describe('count', () => {
            it('should count users by ADMINISTRADOR role', async () => {
                (mockPrismaClient.usuario.count as jest.Mock).mockResolvedValue(
                    5,
                );

                const result = await repository.count({
                    where: { role: UserRole.ADMINISTRADOR },
                });

                expect(mockPrismaClient.usuario.count).toHaveBeenCalled();
                expect(result).toBe(5);
            });

            it('should count users by TRABAJADOR role', async () => {
                (mockPrismaClient.usuario.count as jest.Mock).mockResolvedValue(
                    20,
                );

                const result = await repository.count({
                    where: { role: UserRole.TRABAJADOR },
                });

                expect(mockPrismaClient.usuario.count).toHaveBeenCalled();
                expect(result).toBe(20);
            });

            it('should return 0 when no users found for role', async () => {
                (mockPrismaClient.usuario.count as jest.Mock).mockResolvedValue(
                    0,
                );

                const result = await repository.count({
                    where: { role: UserRole.ADMINISTRADOR },
                });

                expect(result).toBe(0);
            });
        });

        describe('findAll', () => {
            it('should return all users with default pagination', async () => {
                (
                    mockPrismaClient.usuario.findMany as jest.Mock
                ).mockResolvedValue([mockUserData]);

                const result = await repository.findAll();

                expect(mockPrismaClient.usuario.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        skip: 0,
                        take: 10,
                    }),
                );
                expect(result).toHaveLength(1);
                expect(result[0].correo).toBe('juan@example.com');
            });

            it('should apply search filter correctly', async () => {
                (
                    mockPrismaClient.usuario.findMany as jest.Mock
                ).mockResolvedValue([]);

                await repository.findAll({ search: 'juan', page: 1, limit: 5 });

                const callArgs = (
                    mockPrismaClient.usuario.findMany as jest.Mock
                ).mock.calls[0][0];
                expect(callArgs.where).toEqual({
                    OR: [
                        { nombres: { contains: 'juan', mode: 'insensitive' } },
                        { correo: { contains: 'juan', mode: 'insensitive' } },
                    ],
                });
                expect(callArgs.skip).toBe(0);
                expect(callArgs.take).toBe(5);
            });

            it('should apply role and estado filters', async () => {
                (
                    mockPrismaClient.usuario.findMany as jest.Mock
                ).mockResolvedValue([]);

                await repository.findAll({
                    role: UserRole.ADMINISTRADOR,
                    estado: UserState.ACTIVO,
                });

                const callArgs = (
                    mockPrismaClient.usuario.findMany as jest.Mock
                ).mock.calls[0][0];
                expect(callArgs.where.rol).toBe('ADMINISTRADOR');
                expect(callArgs.where.estado).toBe('ACTIVO');
            });

            it('should handle empty results', async () => {
                (
                    mockPrismaClient.usuario.findMany as jest.Mock
                ).mockResolvedValue([]);

                const result = await repository.findAll();

                expect(result).toEqual([]);
            });
        });

        describe('countAll', () => {
            it('should count users without filters', async () => {
                (mockPrismaClient.usuario.count as jest.Mock).mockResolvedValue(
                    10,
                );

                const result = await repository.countAll();

                expect(result).toBe(10);
                expect(mockPrismaClient.usuario.count).toHaveBeenCalledWith({
                    where: {},
                });
            });

            it('should count users with search filter', async () => {
                (mockPrismaClient.usuario.count as jest.Mock).mockResolvedValue(
                    3,
                );

                const result = await repository.countAll({ search: 'juan' });

                expect(result).toBe(3);
                const callArgs = (mockPrismaClient.usuario.count as jest.Mock)
                    .mock.calls[0][0];
                expect(callArgs.where).toEqual({
                    OR: [
                        { nombres: { contains: 'juan', mode: 'insensitive' } },
                        { correo: { contains: 'juan', mode: 'insensitive' } },
                    ],
                });
            });

            it('should count users with role filter', async () => {
                (mockPrismaClient.usuario.count as jest.Mock).mockResolvedValue(
                    5,
                );

                await repository.countAll({ role: UserRole.TRABAJADOR });

                const callArgs = (mockPrismaClient.usuario.count as jest.Mock)
                    .mock.calls[0][0];
                expect(callArgs.where.rol).toBe('TRABAJADOR');
            });
        });

        describe('save edge cases', () => {
            it('should call update when user has existing ID', async () => {
                const existingUser = new User(
                    1,
                    'Juan',
                    'Pérez Updated',
                    'juan@example.com',
                    'hashed_pwd',
                    new Date('2024-01-01'),
                    UserRole.ADMINISTRADOR,
                    UserState.ACTIVO,
                    new Date('2024-01-02'),
                );

                (
                    mockPrismaClient.usuario.update as jest.Mock
                ).mockResolvedValue(mockUserData);

                const result = await repository.save(existingUser);

                expect(mockPrismaClient.usuario.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: 1 },
                    }),
                );
                expect(result.id).toBe(1);
            });
        });
    });
});
