import { describe, expect, it } from '@jest/globals';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

/**
 * Branch coverage extra para User.rename: `if (nombres !== undefined)`
 *  - nombres provisto    -> actualiza (y recorta).
 *  - nombres undefined    -> conserva el valor previo.
 */
describe('Users module — User.rename branches2', () => {
    const buildUser = () =>
        new User(
            1,
            'Juan',
            'Perez',
            'juan@bioactiva.com',
            'hashed',
            new Date(),
            UserRole.TRABAJADOR,
            UserState.ACTIVO,
            new Date(),
        );

    it('updates nombres when provided', () => {
        const user = buildUser();
        user.rename('  Carlos  ', undefined);
        expect(user.nombres).toBe('Carlos');
        expect(user.apellidos).toBe('Perez');
    });

    it('keeps the previous nombres when it is undefined', () => {
        const user = buildUser();
        user.rename(undefined, 'Lopez');
        expect(user.nombres).toBe('Juan');
        expect(user.apellidos).toBe('Lopez');
    });
});
