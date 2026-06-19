import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DisableUserUseCase } from '@/modules/users/application/use-cases/disable-user.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { UserCannotBeRevokedException } from '@/modules/users/domain/exceptions/user-cannot-be-revoked.exception';

describe('Users module', () => {
    describe('DisableUserUseCase', () => {
        let useCase: DisableUserUseCase;
        let repository: any;

        const buildUser = (estado: UserState) =>
            new User(
                2,
                'Ana',
                'García',
                'ana@example.com',
                'hashed-password',
                new Date(),
                UserRole.TRABAJADOR,
                estado,
                new Date(),
            );

        beforeEach(() => {
            repository = {
                findById: jest.fn(),
                save: jest.fn(async (u: User) => u),
            };
            useCase = new DisableUserUseCase(repository);
        });

        it('disables an active user and persists the change', async () => {
            const user = buildUser(UserState.ACTIVO);
            repository.findById.mockResolvedValue(user);

            await useCase.execute(2, 1);

            expect(user.estado).toBe(UserState.SUSPENDIDO);
            expect(repository.save).toHaveBeenCalledWith(user);
        });

        it('rejects an administrator disabling their own account', async () => {
            await expect(useCase.execute(1, 1)).rejects.toThrow(
                UserCannotBeRevokedException,
            );
            expect(repository.findById).not.toHaveBeenCalled();
            expect(repository.save).not.toHaveBeenCalled();
        });

        it('throws when the target user does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(useCase.execute(99, 1)).rejects.toThrow(
                UserNotFoundException,
            );
            expect(repository.save).not.toHaveBeenCalled();
        });

        it('throws when the user is already disabled', async () => {
            repository.findById.mockResolvedValue(
                buildUser(UserState.SUSPENDIDO),
            );

            await expect(useCase.execute(2, 1)).rejects.toThrow(
                UserCannotBeRevokedException,
            );
            expect(repository.save).not.toHaveBeenCalled();
        });
    });
});
