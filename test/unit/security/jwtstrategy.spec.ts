import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from '@/modules/auth/infrastructure/jwt/jwt.strategy';
import { User } from '@/modules/users/domain/entities/user';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '../../../src/shared/domain/enums/rol';

describe('Security module', () => {
    /**
     * JwtStrategy
     * ----------
     * Responsable de:
     * - validación de payload JWT
     * - buscar usuario desde el repositorio
     * - validar que usuario esté activo
     * - lanzar UnauthorizedException si el usuario no existe o está inactivo
     */
    // STATUS: Implementación completa (Passport JWT strategy con validación de estado).
    describe('JWT strategy validation', () => {
        let strategy: JwtStrategy;
        let authUserRepository: any;

        const createdAt = new Date('2024-01-01T00:00:00.000Z');
        const updatedAt = new Date('2024-01-02T00:00:00.000Z');

        const buildActiveUser = () =>
            new User(
                1,
                'Ana',
                'Paredes',
                'ana@bioactiva.com',
                'hashed-password',
                createdAt,
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                updatedAt,
            );

        const buildInactiveUser = () =>
            new User(
                2,
                'Luis',
                'Perez',
                'luis@bioactiva.com',
                'hashed-password',
                createdAt,
                UserRole.TRABAJADOR,
                UserState.PENDIENTE,
                updatedAt,
            );

        beforeEach(() => {
            process.env.JWT_SECRET = 'jwt-secret';
            process.env.JWT_ISSUER = 'bioactiva';
            process.env.JWT_AUDIENCE = 'bioactiva-clients';

            authUserRepository = {
                findById: jest.fn(),
            };

            strategy = new JwtStrategy(authUserRepository);
        });

        it('should validate and return active user when payload is valid', async () => {
            const activeUser = buildActiveUser();
            authUserRepository.findById.mockResolvedValue(activeUser);

            const result = await strategy.validate({ sub: '1' });

            expect(result).toEqual(activeUser);
            expect(result.estado).toBe(UserState.ACTIVO);
            expect(authUserRepository.findById).toHaveBeenCalledWith(1);
        });

        it('should throw UnauthorizedException when user is not found', async () => {
            authUserRepository.findById.mockResolvedValue(null);

            await expect(strategy.validate({ sub: '999' })).rejects.toThrow(
                UnauthorizedException,
            );
            expect(authUserRepository.findById).toHaveBeenCalledWith(999);
        });

        it('should throw UnauthorizedException when user is inactive (PENDIENTE)', async () => {
            const inactiveUser = buildInactiveUser();
            authUserRepository.findById.mockResolvedValue(inactiveUser);

            await expect(strategy.validate({ sub: '2' })).rejects.toThrow(
                UnauthorizedException,
            );
            expect(authUserRepository.findById).toHaveBeenCalledWith(2);
        });

        it('should throw UnauthorizedException when user is suspended (SUSPENDIDO)', async () => {
            const suspendedUser = new User(
                3,
                'Carlos',
                'Lopez',
                'carlos@bioactiva.com',
                'hashed-password',
                createdAt,
                UserRole.TRABAJADOR,
                UserState.SUSPENDIDO,
                updatedAt,
            );
            authUserRepository.findById.mockResolvedValue(suspendedUser);

            await expect(strategy.validate({ sub: '3' })).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw error when JWT_SECRET is not configured during initialization', () => {
            delete process.env.JWT_SECRET;

            expect(() => new JwtStrategy(authUserRepository)).toThrow(
                'JWT_SECRET no configurado',
            );
        });

        it('should handle repository errors gracefully', async () => {
            const repositoryError = new Error('Database error');
            authUserRepository.findById.mockRejectedValue(repositoryError);

            await expect(strategy.validate({ sub: '1' })).rejects.toThrow(
                'Database error',
            );
        });
    });
});
