import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UpdateOwnProfileUseCase } from '@/modules/users/application/use-cases/update-own-profile.use-case';
import { InvalidUserUpdateException } from '@/modules/users/domain/exceptions/invalid-user-update.exception';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('UpdateOwnProfileUseCase', () => {
    let userRepository: any;
    let useCase: UpdateOwnProfileUseCase;

    const buildUser = () =>
        new User(
            1,
            'Juan',
            'Pérez',
            'juan@example.com',
            'hashed',
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
        useCase = new UpdateOwnProfileUseCase(userRepository);
    });

    it('should update nombres and apellidos (trimming whitespace)', async () => {
        const user = buildUser();
        userRepository.findById.mockResolvedValue(user);

        const result = await useCase.execute(1, {
            nombres: '  Juan Carlos  ',
            apellidos: '  Pérez Ramos ',
        });

        expect(result.nombres).toBe('Juan Carlos');
        expect(result.apellidos).toBe('Pérez Ramos');
        expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should update only the provided field', async () => {
        const user = buildUser();
        userRepository.findById.mockResolvedValue(user);

        const result = await useCase.execute(1, { nombres: 'Juanito' });

        expect(result.nombres).toBe('Juanito');
        expect(result.apellidos).toBe('Pérez');
    });

    it('should reject when no field is provided', async () => {
        await expect(useCase.execute(1, {})).rejects.toBeInstanceOf(
            InvalidUserUpdateException,
        );
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw when the user does not exist', async () => {
        userRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute(1, { nombres: 'Juanito' }),
        ).rejects.toBeInstanceOf(UserNotFoundException);
    });
});
