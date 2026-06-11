import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ChangeUserRoleUseCase } from '@/modules/users/application/use-cases/change-user-role.use-case';
import { CannotChangeOwnRoleException } from '@/modules/users/domain/exceptions/cannot-change-own-role.exception';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('ChangeUserRoleUseCase', () => {
    let userRepository: any;
    let useCase: ChangeUserRoleUseCase;

    const buildUser = (role: UserRole, tokenVersion = 0) =>
        new User(
            2,
            'Ana',
            'García',
            'ana@example.com',
            'hashed',
            new Date('2026-01-01T00:00:00.000Z'),
            role,
            UserState.ACTIVO,
            new Date('2026-01-02T00:00:00.000Z'),
            tokenVersion,
        );

    beforeEach(() => {
        userRepository = {
            findById: jest.fn(),
            save: jest.fn(),
        };
        userRepository.save.mockImplementation((u: User) => Promise.resolve(u));
        useCase = new ChangeUserRoleUseCase(userRepository);
    });

    it('should change the role and invalidate the session (bump tokenVersion)', async () => {
        const user = buildUser(UserRole.TRABAJADOR, 3);
        userRepository.findById.mockResolvedValue(user);

        const result = await useCase.execute(2, UserRole.ADMINISTRADOR, 1);

        expect(result.role).toBe(UserRole.ADMINISTRADOR);
        expect(result.tokenVersion).toBe(4);
        expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should reject when an admin tries to change their own role', async () => {
        await expect(
            useCase.execute(1, UserRole.TRABAJADOR, 1),
        ).rejects.toBeInstanceOf(CannotChangeOwnRoleException);
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw when the target user does not exist', async () => {
        userRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute(2, UserRole.ADMINISTRADOR, 1),
        ).rejects.toBeInstanceOf(UserNotFoundException);
    });

    it('should be a no-op on tokenVersion when the role is unchanged', async () => {
        const user = buildUser(UserRole.ADMINISTRADOR, 3);
        userRepository.findById.mockResolvedValue(user);

        const result = await useCase.execute(2, UserRole.ADMINISTRADOR, 1);

        expect(result.role).toBe(UserRole.ADMINISTRADOR);
        expect(result.tokenVersion).toBe(3);
    });
});
