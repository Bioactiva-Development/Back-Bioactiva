import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { UserController } from '@/modules/users/infrastructure/http/user.controller';
import { GetAllUsersUseCase } from '@/modules/users/application/use-cases/get-all-users.use-case';
import { GetAssignableUsersUseCase } from '@/modules/users/application/use-cases/get-assignable-users.use-case';
import { DisableUserUseCase } from '@/modules/users/application/use-cases/disable-user.use-case';
import { EnableUserUseCase } from '@/modules/users/application/use-cases/enable-user.use-case';
import { ChangeUserRoleUseCase } from '@/modules/users/application/use-cases/change-user-role.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';

describe('UserController (branches)', () => {
    let controller: UserController;
    let getAllUsersUseCase: jest.Mocked<GetAllUsersUseCase>;
    let disableUserUseCase: jest.Mocked<DisableUserUseCase>;
    let enableUserUseCase: jest.Mocked<EnableUserUseCase>;

    beforeEach(async () => {
        getAllUsersUseCase = { execute: jest.fn() } as any;
        disableUserUseCase = { execute: jest.fn() } as any;
        enableUserUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                { provide: GetAllUsersUseCase, useValue: getAllUsersUseCase },
                {
                    provide: GetAssignableUsersUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: DisableUserUseCase,
                    useValue: disableUserUseCase,
                },
                {
                    provide: EnableUserUseCase,
                    useValue: enableUserUseCase,
                },
                {
                    provide: ChangeUserRoleUseCase,
                    useValue: { execute: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get(UserController);
    });

    it('findAll maps every optional filter when all are present', async () => {
        getAllUsersUseCase.execute.mockResolvedValue({ data: [], total: 0 });

        const query = {
            search: 'john',
            role: UserRole.TRABAJADOR,
            estado: 'ACTIVO',
            page: 2,
            limit: 25,
        } as any;
        const currentUser = { role: UserRole.ADMINISTRADOR } as User;

        await controller.findAll(query, currentUser);

        const [dto] = getAllUsersUseCase.execute.mock.calls[0];
        expect(dto.search).toBe('john');
        expect(dto.role).toBe(UserRole.TRABAJADOR);
        expect(dto.estado).toBe('ACTIVO');
    });

    it('findAll maps undefined optional filters when all are omitted', async () => {
        getAllUsersUseCase.execute.mockResolvedValue({ data: [], total: 0 });

        const query = {} as any;
        const currentUser = { role: UserRole.ADMINISTRADOR } as User;

        await controller.findAll(query, currentUser);

        const [dto] = getAllUsersUseCase.execute.mock.calls[0];
        expect(dto.search).toBeUndefined();
        expect(dto.role).toBeUndefined();
        expect(dto.estado).toBeUndefined();
    });

    it('disable forwards the target id and the current user id', async () => {
        disableUserUseCase.execute.mockResolvedValue(undefined as any);

        await controller.disable({ id: 5 } as any, { id: 9 } as User);

        expect(disableUserUseCase.execute).toHaveBeenCalledWith(5, 9);
    });

    it('enable forwards the target id', async () => {
        enableUserUseCase.execute.mockResolvedValue(undefined as any);

        await controller.enable({ id: 7 } as any);

        expect(enableUserUseCase.execute).toHaveBeenCalledWith(7);
    });
});
