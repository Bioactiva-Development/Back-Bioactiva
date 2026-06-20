import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { UserController } from '@/modules/users/infrastructure/http/user.controller';
import { GetAllUsersUseCase } from '@/modules/users/application/use-cases/get-all-users.use-case';
import { GetAssignableUsersUseCase } from '@/modules/users/application/use-cases/get-assignable-users.use-case';
import { DisableUserUseCase } from '@/modules/users/application/use-cases/disable-user.use-case';
import { EnableUserUseCase } from '@/modules/users/application/use-cases/enable-user.use-case';
import { ChangeUserRoleUseCase } from '@/modules/users/application/use-cases/change-user-role.use-case';
import { User } from '@/modules/users/domain/entities/user';

describe('UserController (disable/enable)', () => {
    let controller: UserController;
    let disableUserUseCase: jest.Mocked<DisableUserUseCase>;
    let enableUserUseCase: jest.Mocked<EnableUserUseCase>;

    beforeEach(async () => {
        disableUserUseCase = { execute: jest.fn() } as any;
        enableUserUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                { provide: GetAllUsersUseCase, useValue: { execute: jest.fn() } },
                {
                    provide: GetAssignableUsersUseCase,
                    useValue: { execute: jest.fn() },
                },
                { provide: DisableUserUseCase, useValue: disableUserUseCase },
                { provide: EnableUserUseCase, useValue: enableUserUseCase },
                {
                    provide: ChangeUserRoleUseCase,
                    useValue: { execute: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get(UserController);
    });

    it('disable forwards the target id and the requesting user id', async () => {
        disableUserUseCase.execute.mockResolvedValue(undefined);

        const currentUser = { id: 1 } as User;
        await controller.disable({ id: 2 } as any, currentUser);

        expect(disableUserUseCase.execute).toHaveBeenCalledWith(2, 1);
    });

    it('enable forwards the target id', async () => {
        enableUserUseCase.execute.mockResolvedValue(undefined);

        await controller.enable({ id: 5 } as any);

        expect(enableUserUseCase.execute).toHaveBeenCalledWith(5);
    });
});
