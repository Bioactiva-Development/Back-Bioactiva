import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';

import { PrismaUserAuthRepository } from '@/modules/auth/infrastructure/persistance/prisma-user-auth.repository';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '../../../src/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';

describe('Security module', () => {
    /**
     * PrismaUserAuthRepository
     * ----------
     * Responsable de:
     * - consulta de usuario por correo para autenticación
     * - consulta de usuario por id para refresh/me
     * - persistencia de cambios de usuario
     * - manejo de errores de Prisma
     */
    // STATUS: Implementación completa (queries de auth y persistencia con error handling).
    describe('Prisma user auth repository', () => {
        let repository: PrismaUserAuthRepository;
        let prismaMock: jest.Mocked<PrismaClient>;

        const mockUserRecord = {
            id: 1,
            nombres: 'Ana',
            apellidos: 'Paredes',
            correo: 'ana@bioactiva.com',
            password: 'hashed-password',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            rol: 'TRABAJADOR' as const,
            estado: 'ACTIVO' as const,
            updated_at: new Date('2024-01-02T00:00:00.000Z'),
            id_organizacion: 1,
            id_contacto_activo: null,
        };

        const buildUser = () =>
            new User(
                1,
                'Ana',
                'Paredes',
                'ana@bioactiva.com',
                'hashed-password',
                new Date('2024-01-01T00:00:00.000Z'),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date('2024-01-02T00:00:00.000Z'),
            );

        beforeEach(() => {
            prismaMock = {
                usuario: {
                    findUnique: jest.fn(),
                    update: jest.fn(),
                },
            } as unknown as jest.Mocked<PrismaClient>;

            repository = new PrismaUserAuthRepository(prismaMock);
        });

        describe('findByCorreo', () => {
            it('should return user when email exists', async () => {
                prismaMock.usuario.findUnique.mockResolvedValue(
                    mockUserRecord as never,
                );
                jest.spyOn(UserMapper, 'toDomain').mockReturnValue(buildUser());

                const result =
                    await repository.findByCorreo('ana@bioactiva.com');

                expect(result).toBeDefined();
                expect(result?.correo).toBe('ana@bioactiva.com');
                expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
                    where: { correo: 'ana@bioactiva.com' },
                });
            });

            it('should return null when email does not exist', async () => {
                prismaMock.usuario.findUnique.mockResolvedValue(null);

                const result = await repository.findByCorreo(
                    'notfound@bioactiva.com',
                );

                expect(result).toBeNull();
                expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
                    where: { correo: 'notfound@bioactiva.com' },
                });
            });

            it('should throw error when database query fails', async () => {
                const dbError = new Error('Database connection error');
                prismaMock.usuario.findUnique.mockRejectedValue(dbError);

                await expect(
                    repository.findByCorreo('ana@bioactiva.com'),
                ).rejects.toThrow('Database connection error');
            });
        });

        describe('findById', () => {
            it('should return user when id exists', async () => {
                prismaMock.usuario.findUnique.mockResolvedValue(
                    mockUserRecord as never,
                );
                jest.spyOn(UserMapper, 'toDomain').mockReturnValue(buildUser());

                const result = await repository.findById(1);

                expect(result).toBeDefined();
                expect(result?.id).toBe(1);
                expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
                    where: { id: 1 },
                });
            });

            it('should return null when user id does not exist', async () => {
                prismaMock.usuario.findUnique.mockResolvedValue(null);

                const result = await repository.findById(999);

                expect(result).toBeNull();
                expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
                    where: { id: 999 },
                });
            });

            it('should throw error when database query fails', async () => {
                const dbError = new Error('Connection timeout');
                prismaMock.usuario.findUnique.mockRejectedValue(dbError);

                await expect(repository.findById(1)).rejects.toThrow(
                    'Connection timeout',
                );
            });
        });

        describe('save', () => {
            it('should throw when user id is null', async () => {
                const nullIdUser = new User(
                    null as any,
                    'Test',
                    'User',
                    'test@bioactiva.com',
                    'pass',
                    new Date(),
                    UserRole.TRABAJADOR,
                    UserState.ACTIVO,
                    new Date(),
                );

                await expect(repository.save(nullIdUser)).rejects.toThrow(
                    'User ID cannot be null when saving',
                );
                expect(prismaMock.usuario.update).not.toHaveBeenCalled();
            });

            it('should update and return user with new state', async () => {
                const inactiveUser = new User(
                    1,
                    'Ana',
                    'Paredes',
                    'ana@bioactiva.com',
                    'hashed-password',
                    new Date('2024-01-01T00:00:00.000Z'),
                    UserRole.TRABAJADOR,
                    UserState.PENDIENTE,
                    new Date('2024-01-02T00:00:00.000Z'),
                );
                inactiveUser.activate(); // Change state to ACTIVO

                prismaMock.usuario.update.mockResolvedValue({
                    ...mockUserRecord,
                    estado: 'ACTIVO',
                } as never);
                jest.spyOn(UserMapper, 'toDomain').mockReturnValue(
                    inactiveUser,
                );

                const result = await repository.save(inactiveUser);
                expect(result).toBeDefined();
                expect(result.estado).toBe(UserState.ACTIVO);
                expect(prismaMock.usuario.update).toHaveBeenCalledWith({
                    where: { id: 1 },
                    data: expect.objectContaining({
                        nombres: 'Ana',
                        apellidos: 'Paredes',
                        correo: 'ana@bioactiva.com',
                        estado: 'ACTIVO',
                        rol: 'TRABAJADOR',
                    }),
                });
            });

            it('should map user role to ADMINISTRADOR', async () => {
                const adminUser = new User(
                    2,
                    'Admin',
                    'User',
                    'admin@bioactiva.com',
                    'hashed-password',
                    new Date(),
                    UserRole.ADMINISTRADOR,
                    UserState.ACTIVO,
                    new Date(),
                );

                prismaMock.usuario.update.mockResolvedValue({
                    ...mockUserRecord,
                    id: 2,
                    rol: 'ADMINISTRADOR',
                } as never);
                jest.spyOn(UserMapper, 'toDomain').mockReturnValue(adminUser);

                await repository.save(adminUser);

                expect(prismaMock.usuario.update).toHaveBeenCalledWith({
                    where: { id: 2 },
                    data: expect.objectContaining({
                        rol: 'ADMINISTRADOR',
                    }),
                });
            });

            it('should throw error when update fails', async () => {
                const user = buildUser();
                const updateError = new Error('Update failed');
                prismaMock.usuario.update.mockRejectedValue(updateError);

                await expect(repository.save(user)).rejects.toThrow(
                    'Update failed',
                );
            });
        });
    });
});
