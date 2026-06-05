import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { PrismaInvitationsRepository } from '@/modules/invitations/infrastructure/persistance/prisma-invitation.repository';
import { InvitationToken } from '@/modules/invitations/domain/entities/invitation_token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';
import { UserRole } from '@/shared/domain/enums/rol';

describe('Invitations module', () => {
    /**
     * PrismaInvitationsRepository
     * ----------
     * Responsable de:
     * - listar invitaciones con filtrado y paginación
     * - buscar invitaciones pendientes expiradas
     * - buscar por id, token, correo
     * - persistencia de cambios de estado
     */
    // STATUS: Implementación completa (CRUD + queries).
    describe('PrismaInvitationsRepository', () => {
        let repository: PrismaInvitationsRepository;
        let prismaMock: jest.Mocked<PrismaClient>;

        const mockInvitationRecord = {
            id: 1,
            tokenHash: 'hashed-token',
            correo: 'user@bioactiva.com',
            proposito: 'INVITACION' as const,
            estado: 'PENDIENTE' as const,
            rol: 'TRABAJADOR' as const,
            expiresAt: new Date('2024-01-08T00:00:00Z'),
            consumedAt: null,
            createdAt: new Date('2024-01-01T00:00:00Z'),
            invitadorId: 1,
        };

        beforeEach(() => {
            prismaMock = {
                userToken: {
                    findMany: jest.fn(),
                    findUnique: jest.fn(),
                    findFirst: jest.fn(),
                    upsert: jest.fn(),
                },
            } as unknown as jest.Mocked<PrismaClient>;

            repository = new PrismaInvitationsRepository(prismaMock);
        });

        describe('list', () => {
            it('should list invitations with default pagination', async () => {
                const mockRecords = [mockInvitationRecord];
                prismaMock.userToken.findMany.mockResolvedValue(
                    mockRecords as never,
                );

                const result = await repository.list();

                expect(prismaMock.userToken.findMany).toHaveBeenCalledWith({
                    where: {
                        proposito: 'INVITACION',
                        correo: { contains: undefined },
                        estado: undefined,
                    },
                    skip: 0,
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                });
                expect(result.length).toBeGreaterThanOrEqual(0);
            });

            it('should list invitations with custom pagination', async () => {
                prismaMock.userToken.findMany.mockResolvedValue([]);

                await repository.list(2, 10, 'test', TokenStatus.PENDIENTE);

                expect(prismaMock.userToken.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        skip: 10,
                        take: 10,
                    }),
                );
            });

            it('should filter by search term', async () => {
                prismaMock.userToken.findMany.mockResolvedValue([]);

                await repository.list(1, 10, 'search@', undefined);

                expect(prismaMock.userToken.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            correo: { contains: 'search@' },
                        }),
                    }),
                );
            });

            it('should filter by estado', async () => {
                prismaMock.userToken.findMany.mockResolvedValue([]);

                await repository.list(1, 10, undefined, TokenStatus.CONSUMIDO);

                expect(prismaMock.userToken.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            estado: 'CONSUMIDO',
                        }),
                    }),
                );
            });
        });

        describe('findPendingExpired', () => {
            it('should find pending invitations expired before date', async () => {
                const expiredDate = new Date('2024-01-05T00:00:00Z');
                const mockRecords = [mockInvitationRecord];

                prismaMock.userToken.findMany.mockResolvedValue(
                    mockRecords as never,
                );

                const result = await repository.findPendingExpired(expiredDate);

                expect(prismaMock.userToken.findMany).toHaveBeenCalledWith({
                    where: {
                        proposito: 'INVITACION',
                        estado: 'PENDIENTE',
                        expiresAt: {
                            lte: expiredDate,
                        },
                    },
                    orderBy: { expiresAt: 'asc' },
                });
                expect(Array.isArray(result)).toBe(true);
            });

            it('should return empty array when no expired invitations', async () => {
                prismaMock.userToken.findMany.mockResolvedValue([]);

                const result = await repository.findPendingExpired(new Date());

                expect(result).toEqual([]);
            });
        });

        describe('findById', () => {
            it('should find invitation by id', async () => {
                prismaMock.userToken.findUnique.mockResolvedValue(
                    mockInvitationRecord as never,
                );

                const result = await repository.findById(1);

                expect(prismaMock.userToken.findUnique).toHaveBeenCalledWith({
                    where: { id: 1 },
                });
                expect(result).toBeDefined();
            });

            it('should return null when invitation not found', async () => {
                prismaMock.userToken.findUnique.mockResolvedValue(null);

                const result = await repository.findById(999);

                expect(result).toBeNull();
            });
        });

        describe('findByToken', () => {
            it('should find invitation by token hash', async () => {
                prismaMock.userToken.findFirst.mockResolvedValue(
                    mockInvitationRecord as never,
                );

                const result = await repository.findByToken('hashed-token');

                expect(prismaMock.userToken.findFirst).toHaveBeenCalledWith({
                    where: {
                        tokenHash: 'hashed-token',
                        proposito: 'INVITACION',
                    },
                });
                expect(result).toBeDefined();
            });

            it('should return null when token not found', async () => {
                prismaMock.userToken.findFirst.mockResolvedValue(null);

                const result = await repository.findByToken('invalid-token');

                expect(result).toBeNull();
            });
        });

        describe('findPendingByEmail', () => {
            it('should find pending invitation by email', async () => {
                prismaMock.userToken.findFirst.mockResolvedValue(
                    mockInvitationRecord as never,
                );

                const result =
                    await repository.findPendingByEmail('user@bioactiva.com');

                expect(prismaMock.userToken.findFirst).toHaveBeenCalledWith({
                    where: {
                        correo: 'user@bioactiva.com',
                        estado: 'PENDIENTE',
                        proposito: 'INVITACION',
                    },
                });
                expect(result).toBeDefined();
            });

            it('should return null when no pending invitation for email', async () => {
                prismaMock.userToken.findFirst.mockResolvedValue(null);

                const result = await repository.findPendingByEmail(
                    'nouser@bioactiva.com',
                );

                expect(result).toBeNull();
            });
        });

        describe('save', () => {
            it('should save new invitation', async () => {
                const newInvitation = new InvitationToken(
                    null,
                    'newuser@bioactiva.com',
                    'new-token',
                    UserRole.TRABAJADOR,
                    1,
                    TokenStatus.PENDIENTE,
                    new Date(),
                    null,
                    new Date(),
                );

                prismaMock.userToken.upsert.mockResolvedValue({
                    ...mockInvitationRecord,
                    id: 2,
                } as never);

                await repository.save(newInvitation);

                expect(prismaMock.userToken.upsert).toHaveBeenCalled();
            });

            it('should update existing invitation estado', async () => {
                const existingInvitation = new InvitationToken(
                    1,
                    'user@bioactiva.com',
                    'hashed-token',
                    UserRole.TRABAJADOR,
                    1,
                    TokenStatus.CONSUMIDO,
                    new Date(),
                    new Date(),
                    new Date(),
                );

                prismaMock.userToken.upsert.mockResolvedValue({
                    ...mockInvitationRecord,
                    estado: 'CONSUMIDO',
                } as never);

                await repository.save(existingInvitation);

                expect(prismaMock.userToken.upsert).toHaveBeenCalledWith(
                    expect.objectContaining({
                        update: expect.objectContaining({
                            estado: 'CONSUMIDO',
                        }),
                    }),
                );
            });

            it('should throw error on database failure', async () => {
                const invitation = new InvitationToken(
                    1,
                    'user@bioactiva.com',
                    'token',
                    UserRole.TRABAJADOR,
                    1,
                    TokenStatus.PENDIENTE,
                    new Date(),
                    null,
                    new Date(),
                );

                const dbError = new Error('Database error');
                prismaMock.userToken.upsert.mockRejectedValue(dbError);

                await expect(repository.save(invitation)).rejects.toThrow(
                    'Database error',
                );
            });
        });
    });
});
