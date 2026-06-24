import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetAssignableUsersUseCase } from '@/modules/users/application/use-cases/get-assignable-users.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('Users module', () => {
    describe('GetAssignableUsersUseCase', () => {
        let useCase: GetAssignableUsersUseCase;
        let repository: any;

        const buildUser = (id: number, role: UserRole) =>
            new User(
                id,
                `Nombre${id}`,
                'Apellido',
                `user${id}@example.com`,
                'hashed',
                new Date(),
                role,
                UserState.ACTIVO,
                new Date(),
            );

        beforeEach(() => {
            repository = { findEnabled: jest.fn() };
            useCase = new GetAssignableUsersUseCase(repository);
        });

        it('returns the enabled users regardless of role', async () => {
            const users = [
                buildUser(1, UserRole.ADMINISTRADOR),
                buildUser(2, UserRole.TRABAJADOR),
            ];
            repository.findEnabled.mockResolvedValue(users);

            const result = await useCase.execute();

            expect(repository.findEnabled).toHaveBeenCalled();
            expect(result).toEqual(users);
        });
    });
});
