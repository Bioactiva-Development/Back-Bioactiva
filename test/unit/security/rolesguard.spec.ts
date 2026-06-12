import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { ExecutionContext } from '@nestjs/common';

import { RolesGuard } from '@/modules/auth/infrastructure/jwt/guards/roles.guard';
import { User } from '@/modules/users/domain/entities/user';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserRole } from '../../../src/shared/domain/enums/rol';

describe('Security module', () => {
    /**
     * RolesGuard
     * ----------
     * Responsable de:
     * - validar acceso según rol
     * - permitir acceso cuando no hay metadatos
     * - bloquear acceso sin usuario autenticado
     */
    // STATUS: Implementación parcial (rol de usuario y guard de roles).
    describe('Role-based authorization', () => {
        let reflector: { getAllAndOverride: jest.Mock };
        let guard: RolesGuard;

        const buildContext = (user?: User) =>
            ({
                getHandler: jest.fn(),
                getClass: jest.fn(),
                switchToHttp: jest.fn().mockReturnValue({
                    getRequest: jest.fn().mockReturnValue({ user }),
                }),
            }) as unknown as ExecutionContext;

        beforeEach(() => {
            reflector = {
                getAllAndOverride: jest.fn(),
            };

            guard = new RolesGuard(reflector as never);
        });

        it('should allow access when no roles are required', () => {
            reflector.getAllAndOverride.mockReturnValue(undefined);

            expect(guard.canActivate(buildContext())).toBe(true);
        });

        it('should allow access when the user role matches the required role', () => {
            reflector.getAllAndOverride.mockReturnValue([UserRole.TRABAJADOR]);
            const user = new User(
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

            expect(guard.canActivate(buildContext(user))).toBe(true);
        });

        it('should deny access when the user role does not match the required role', () => {
            reflector.getAllAndOverride.mockReturnValue([
                UserRole.ADMINISTRADOR,
            ]);
            const user = new User(
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

            expect(guard.canActivate(buildContext(user))).toBe(false);
        });

        it('should deny access when roles are required but the request has no user', () => {
            reflector.getAllAndOverride.mockReturnValue([UserRole.TRABAJADOR]);

            expect(guard.canActivate(buildContext())).toBe(false);
        });
    });
});
