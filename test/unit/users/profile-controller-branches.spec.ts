import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ProfileController } from '@/modules/users/infrastructure/http/profile.controller';
import { UpdateOwnProfileUseCase } from '@/modules/users/application/use-cases/update-own-profile.use-case';
import { ChangeOwnPasswordUseCase } from '@/modules/users/application/use-cases/change-own-password.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('ProfileController (branches)', () => {
    let controller: ProfileController;
    let updateOwnProfileUseCase: jest.Mocked<UpdateOwnProfileUseCase>;

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

        const module = await Test.createTestingModule({
            controllers: [ProfileController],
            providers: [
                {
                    provide: UpdateOwnProfileUseCase,
                    useValue: updateOwnProfileUseCase,
                },
                {
                    provide: ChangeOwnPasswordUseCase,
                    useValue: { execute: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get(ProfileController);
    });

    it('updateMyProfile forwards both fields when present', async () => {
        updateOwnProfileUseCase.execute.mockResolvedValue(currentUser);

        await controller.updateMyProfile(
            { nombres: 'Juanito', apellidos: 'Apellido' },
            currentUser,
        );

        expect(updateOwnProfileUseCase.execute).toHaveBeenCalledWith(7, {
            nombres: 'Juanito',
            apellidos: 'Apellido',
        });
    });

    it('updateMyProfile forwards undefined fields when both are omitted', async () => {
        updateOwnProfileUseCase.execute.mockResolvedValue(currentUser);

        await controller.updateMyProfile({} as any, currentUser);

        expect(updateOwnProfileUseCase.execute).toHaveBeenCalledWith(7, {
            nombres: undefined,
            apellidos: undefined,
        });
    });
});
