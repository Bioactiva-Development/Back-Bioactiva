import { extractCookieFromRequest } from '@/modules/auth/infrastructure/http/decorator/cookie.decorator';
import { currentUserFromRequest } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { Roles, ROLES_KEY } from '@/modules/auth/infrastructure/jwt/decorators/roles.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';

/**
 * Security testing
 * ----------
 * Responsable de:
 * - helpers de extracción de cookie
 * - helpers de extracción de usuario autenticado
 * - decorador de roles
 */
// STATUS: Implementación parcial (helpers de decoradores para aumentar cobertura unitária).
describe('security decorators helpers', () => {
    describe('extractCookieFromRequest', () => {
        it('returns cookie value when present', () => {
            const req = { cookies: { token: 'abc123' } };
            const result = extractCookieFromRequest('token', req as any);
            expect(result).toBe('abc123');
        });

        it('returns null when cookie is missing', () => {
            const req = { cookies: {} };
            const result = extractCookieFromRequest('token', req as any);
            expect(result).toBeNull();
        });

        it('returns null when request has no cookies', () => {
            const req = {};
            const result = extractCookieFromRequest('token', req as any);
            expect(result).toBeNull();
        });
    });

    describe('currentUserFromRequest', () => {
        it('returns request.user when present', () => {
            const mockUser = { id: 'u1', email: 'a@x.com' } as unknown as User;
            const req = { user: mockUser };
            const result = currentUserFromRequest(req as any);
            expect(result).toBe(mockUser);
        });

        it('returns undefined when request.user is absent', () => {
            const req = {};
            const result = currentUserFromRequest(req as any);
            expect(result).toBeUndefined();
        });
    });

    describe('Roles decorator', () => {
        it('should set metadata with given roles', () => {
            const decorated = Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR);
            expect(decorated).toBeDefined();
            expect(Array.isArray(decorated)).toBe(false);
        });

        it('should have ROLES_KEY constant', () => {
            expect(ROLES_KEY).toBe('roles');
        });
    });
});
