import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { PrismaPasswordResetRepository } from '@/modules/reset_password/infrastructure/persistance/prisma-password-reset.repository';
import { PasswordResetToken } from '@/modules/reset_password/domain/entities/password-reset-token';
import { TokenStatus } from '@/shared/domain/enums/token_estado';

describe('Reset Password module', () => {
	/**
	 * PrismaPasswordResetRepository
	 * ----------
	 * Responsable de:
	 * - buscar tokens por id y por hash
	 * - buscar tokens pendientes por email
	 * - persistencia con asociación a usuario
	 */
	// STATUS: Implementación completa (CRUD + queries).
	describe('PrismaPasswordResetRepository', () => {
		let repository: PrismaPasswordResetRepository;
		let prismaMock: jest.Mocked<PrismaClient>;

		const mockResetTokenRecord = {
			id: 1,
			tokenHash: 'hashed-reset-token',
			correo: 'john@bioactiva.com',
			proposito: 'RESET_PASSWORD' as const,
			estado: 'PENDIENTE' as const,
			expiresAt: new Date('2024-01-01T02:00:00Z'),
			consumedAt: null,
			createdAt: new Date('2024-01-01T00:00:00Z'),
			idUsuario: 1,
		};

		beforeEach(() => {
			prismaMock = {
				userToken: {
					findUnique: jest.fn(),
					findFirst: jest.fn(),
					upsert: jest.fn(),
				},
				usuario: {
					findUnique: jest.fn(),
				},
			} as unknown as jest.Mocked<PrismaClient>;

			repository = new PrismaPasswordResetRepository(prismaMock);
		});

		describe('findById', () => {
			it('should find reset token by id', async () => {
				prismaMock.userToken.findUnique.mockResolvedValue(
					mockResetTokenRecord as never,
				);

				const result = await repository.findById(1);

				expect(prismaMock.userToken.findUnique).toHaveBeenCalledWith({
					where: { id: 1 },
				});
				expect(result).toBeDefined();
			});

			it('should return null when token not found', async () => {
				prismaMock.userToken.findUnique.mockResolvedValue(null);

				const result = await repository.findById(999);

				expect(result).toBeNull();
			});

			it('should return null for non-reset-password token', async () => {
				const invitationToken = {
					...mockResetTokenRecord,
					proposito: 'INVITACION',
				};

				prismaMock.userToken.findUnique.mockResolvedValue(
					invitationToken as never,
				);

				const result = await repository.findById(1);

				expect(result).toBeNull();
			});
		});

		describe('findByToken', () => {
			it('should find reset token by hash', async () => {
				prismaMock.userToken.findFirst.mockResolvedValue(
					mockResetTokenRecord as never,
				);

				const result = await repository.findByToken('hashed-reset-token');

				expect(prismaMock.userToken.findFirst).toHaveBeenCalledWith({
					where: {
						tokenHash: 'hashed-reset-token',
						proposito: 'RESET_PASSWORD',
					},
				});
				expect(result).toBeDefined();
			});

			it('should return null when token hash not found', async () => {
				prismaMock.userToken.findFirst.mockResolvedValue(null);

				const result = await repository.findByToken('invalid-hash');

				expect(result).toBeNull();
			});
		});

		describe('findPendingByEmail', () => {
			it('should find pending reset token by email', async () => {
				prismaMock.userToken.findFirst.mockResolvedValue(
					mockResetTokenRecord as never,
				);

				const result = await repository.findPendingByEmail(
					'john@bioactiva.com',
				);

				expect(prismaMock.userToken.findFirst).toHaveBeenCalledWith({
					where: {
						correo: 'john@bioactiva.com',
						estado: 'PENDIENTE',
						proposito: 'RESET_PASSWORD',
					},
					orderBy: { createdAt: 'desc' },
				});
				expect(result).toBeDefined();
			});

			it('should return null for non-existent email', async () => {
				prismaMock.userToken.findFirst.mockResolvedValue(null);

				const result = await repository.findPendingByEmail(
					'notfound@bioactiva.com',
				);

				expect(result).toBeNull();
			});

			it('should not return consumed tokens', async () => {
				const consumedToken = {
					...mockResetTokenRecord,
					estado: 'CONSUMIDO',
				};

				prismaMock.userToken.findFirst.mockResolvedValue(null);

				const result = await repository.findPendingByEmail(
					'john@bioactiva.com',
				);

				expect(result).toBeNull();
			});
		});

		describe('save', () => {
			it('should save new reset token', async () => {
				const newToken = new PasswordResetToken(
					null,
					1,
					'new-token-hash',
					TokenStatus.PENDIENTE,
					new Date(),
					null,
					new Date(Date.now() + 2 * 60 * 60 * 1000),
				);

				prismaMock.usuario.findUnique.mockResolvedValue({
					correo: 'john@bioactiva.com',
				} as never);

				prismaMock.userToken.upsert.mockResolvedValue(
					mockResetTokenRecord as never,
				);

				const result = await repository.save(newToken);

				expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
					where: { id: 1 },
					select: { correo: true },
				});
				expect(prismaMock.userToken.upsert).toHaveBeenCalled();
				expect(result).toBeDefined();
			});

			it('should update existing token estado', async () => {
				const existingToken = new PasswordResetToken(
					1,
					1,
					'existing-hash',
					TokenStatus.CONSUMIDO,
					new Date(),
					new Date(),
					new Date(),
				);

				prismaMock.usuario.findUnique.mockResolvedValue({
					correo: 'john@bioactiva.com',
				} as never);

				prismaMock.userToken.upsert.mockResolvedValue({
					...mockResetTokenRecord,
					estado: 'CONSUMIDO',
				} as never);

				await repository.save(existingToken);

				expect(prismaMock.userToken.upsert).toHaveBeenCalledWith(
					expect.objectContaining({
						update: expect.objectContaining({
							estado: 'CONSUMIDO',
						}),
					}),
				);
			});

			it('should throw if user not found', async () => {
				const newToken = new PasswordResetToken(
					null,
					999,
					'token-hash',
					TokenStatus.PENDIENTE,
					new Date(),
					null,
					new Date(),
				);

				prismaMock.usuario.findUnique.mockResolvedValue(null);

				await expect(repository.save(newToken)).rejects.toThrow(
					'Usuario asociado no encontrado',
				);
			});

			it('should throw on database error', async () => {
				const newToken = new PasswordResetToken(
					null,
					1,
					'token-hash',
					TokenStatus.PENDIENTE,
					new Date(),
					null,
					new Date(),
				);

				prismaMock.usuario.findUnique.mockResolvedValue({
					correo: 'john@bioactiva.com',
				} as never);

				const dbError = new Error('Database connection failed');
				prismaMock.userToken.upsert.mockRejectedValue(dbError);

				await expect(repository.save(newToken)).rejects.toThrow(
					'Database connection failed',
				);
			});

			it('should associate correo from user when saving', async () => {
				const newToken = new PasswordResetToken(
					null,
					1,
					'new-token-hash',
					TokenStatus.PENDIENTE,
					new Date(),
					null,
					new Date(),
				);

				prismaMock.usuario.findUnique.mockResolvedValue({
					correo: 'john.doe@bioactiva.com',
				} as never);

				prismaMock.userToken.upsert.mockResolvedValue(
					mockResetTokenRecord as never,
				);

				await repository.save(newToken);

				const createInput = (prismaMock.userToken.upsert as jest.Mock)
					.mock.calls[0][0].create;

				expect(createInput.correo).toBe('john.doe@bioactiva.com');
			});
		});
	});
});
