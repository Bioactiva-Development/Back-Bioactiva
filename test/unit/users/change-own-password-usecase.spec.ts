import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ChangeOwnPasswordUseCase } from '@/modules/users/application/use-cases/change-own-password.use-case';
import { InvalidCurrentPasswordException } from '@/modules/users/domain/exceptions/invalid-current-password.exception';
import { InvalidUserUpdateException } from '@/modules/users/domain/exceptions/invalid-user-update.exception';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('ChangeOwnPasswordUseCase', () => {
    let userRepository: any;
    let passwordHasher: any;
    let useCase: ChangeOwnPasswordUseCase;

    const buildUser = () =>
        new User(
            1,
            'Juan',
            'Pérez',
            'juan@example.com',
            'hashed-current',
            new Date('2026-01-01T00:00:00.000Z'),
            UserRole.TRABAJADOR,
            UserState.ACTIVO,
            new Date('2026-01-02T00:00:00.000Z'),
        );

    beforeEach(() => {
        userRepository = {
            findById: jest.fn(),
            save: jest.fn(),
        };
        userRepository.save.mockImplementation((u: User) => Promise.resolve(u));
        passwordHasher = {
            compare: jest.fn(),
            hash: jest.fn(),
        };
        useCase = new ChangeOwnPasswordUseCase(userRepository, passwordHasher);
    });

    it('should change the password when the current one is correct', async () => {
        const user = buildUser();
        userRepository.findById.mockResolvedValue(user);
        // 1ra llamada: contraseña actual correcta; 2da: la nueva difiere.
        passwordHasher.compare
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false);
        passwordHasher.hash.mockResolvedValue('hashed-new');

        await useCase.execute(1, 'currentPass', 'brandNewPass');

        expect(passwordHasher.hash).toHaveBeenCalledWith('brandNewPass');
        expect(user.password).toBe('hashed-new');
        expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should reject when the current password is incorrect', async () => {
        const user = buildUser();
        userRepository.findById.mockResolvedValue(user);
        passwordHasher.compare.mockResolvedValue(false);

        await expect(
            useCase.execute(1, 'wrong', 'brandNewPass'),
        ).rejects.toBeInstanceOf(InvalidCurrentPasswordException);
        expect(passwordHasher.hash).not.toHaveBeenCalled();
        expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should reject when the new password equals the current one', async () => {
        const user = buildUser();
        userRepository.findById.mockResolvedValue(user);
        // Actual correcta y la "nueva" coincide con la actual.
        passwordHasher.compare
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true);

        await expect(
            useCase.execute(1, 'currentPass', 'currentPass'),
        ).rejects.toBeInstanceOf(InvalidUserUpdateException);
        expect(passwordHasher.hash).not.toHaveBeenCalled();
    });

    it('should throw when the user does not exist', async () => {
        userRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute(1, 'currentPass', 'brandNewPass'),
        ).rejects.toBeInstanceOf(UserNotFoundException);
    });
});
