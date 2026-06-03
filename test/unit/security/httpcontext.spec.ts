import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';

import {
    Roles,
    ROLES_KEY,
} from '@/modules/auth/infrastructure/jwt/decorators/roles.decorator';
import { UserRole } from '../../../src/shared/domain/enums/rol';

describe('Security module', () => {
    /**
     * HTTP context decorators
     * ----------
     * Responsable de:
     * - adjuntar metadatos de roles
     */
    // STATUS: Implementación parcial (CurrentUser, Roles y ExtractCookie).
    describe('HTTP decorators and request context', () => {
        it('should attach roles metadata to a handler', () => {
            const handler = () => true;

            Roles(UserRole.TRABAJADOR)({} as never, 'handler', {
                value: handler,
            } as PropertyDescriptor);

            expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
                UserRole.TRABAJADOR,
            ]);
        });
    });
});
