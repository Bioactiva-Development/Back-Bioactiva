import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ProfileController } from '@/modules/users/infrastructure/http/profile.controller';
import { UpdateOwnProfileUseCase } from '@/modules/users/application/use-cases/update-own-profile.use-case';
import { ChangeOwnPasswordUseCase } from '@/modules/users/application/use-cases/change-own-password.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('ProfileController', () => {
    let controller: ProfileController;
    let updateOwnProfileUseCase: jest.Mocked<UpdateOwnProfileUseCase>;
    let changeOwnPasswordUseCase: jest.Mocked<ChangeOwnPasswordUseCase>;

    const currentUser = new User(
        7,
        'Juan',
        'Pérez',
        'juan@example.com',
        'hashed',
        new Date('2026-01-01T00:00:00.000Z'),
        UserRole.TRABAJADOR,
        UserState.ACTIVO,
        new Date('2026-01-02T00:00:00.000Z'),
    );

    beforeEach(async () => {
        updateOwnProfileUseCase = { execute: jest.fn() } as any;
        changeOwnPasswordUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [ProfileController],
            providers: [
                {
                    provide: UpdateOwnProfileUseCase,
                    useValue: updateOwnProfileUseCase,
                },
                {
                    provide: ChangeOwnPasswordUseCase,
                    useValue: changeOwnPasswordUseCase,
                },
            ],
        }).compile();

        controller = module.get(ProfileController);
    });

    it('should return the current user profile', () => {
        const result = controller.getMyProfile(currentUser);

        expect(result.id).toBe(7);
        expect(result.correo).toBe('juan@example.com');
    });

    it('should update the profile of the authenticated user', async () => {
        updateOwnProfileUseCase.execute.mockResolvedValue(currentUser);

        const result = await controller.updateMyProfile(
            { nombres: 'Juanito', apellidos: undefined },
            currentUser,
        );

        expect(updateOwnProfileUseCase.execute).toHaveBeenCalledWith(7, {
            nombres: 'Juanito',
            apellidos: undefined,
        });
        expect(result.id).toBe(7);
    });

    it('should change the password of the authenticated user', async () => {
        changeOwnPasswordUseCase.execute.mockResolvedValue(undefined);

        await controller.changeMyPassword(
            { currentPassword: 'old', newPassword: 'newSecret1' },
            currentUser,
        );

        expect(changeOwnPasswordUseCase.execute).toHaveBeenCalledWith(
            7,
            'old',
            'newSecret1',
        );
    });
});
