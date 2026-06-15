import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { UserController } from '@/modules/users/infrastructure/http/user.controller';
import { GetAllUsersUseCase } from '@/modules/users/application/use-cases/get-all-users.use-case';
import { DisableUserUseCase } from '@/modules/users/application/use-cases/disable-user.use-case';
import { EnableUserUseCase } from '@/modules/users/application/use-cases/enable-user.use-case';
import { ChangeUserRoleUseCase } from '@/modules/users/application/use-cases/change-user-role.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('UserController', () => {
    let controller: UserController;
    let getAllUsersUseCase: jest.Mocked<GetAllUsersUseCase>;
    let changeUserRoleUseCase: jest.Mocked<ChangeUserRoleUseCase>;

    beforeEach(async () => {
        getAllUsersUseCase = { execute: jest.fn() } as any;
        changeUserRoleUseCase = { execute: jest.fn() } as any;

        const module = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                { provide: GetAllUsersUseCase, useValue: getAllUsersUseCase },
                {
                    provide: DisableUserUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: EnableUserUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: ChangeUserRoleUseCase,
                    useValue: changeUserRoleUseCase,
                },
            ],
        }).compile();

        controller = module.get(UserController);
    });

    it('should list users with pagination, passing the viewer role', async () => {
        getAllUsersUseCase.execute.mockResolvedValue({
            data: [],
            total: 0,
        });

        const query = { page: 1, limit: 10 } as any;
        const currentUser = { role: UserRole.ADMINISTRADOR } as User;
        const result = await controller.findAll(query, currentUser);

        expect(getAllUsersUseCase.execute).toHaveBeenCalledWith(
            expect.anything(),
            UserRole.ADMINISTRADOR,
        );
        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
    });

    it('forwards the worker role so the use case restricts the listing', async () => {
        getAllUsersUseCase.execute.mockResolvedValue({
            data: [],
            total: 0,
        });

        const query = {
            search: 'john',
            role: 'TRABAJADOR',
            estado: 'ACTIVO',
            page: 1,
            limit: 20,
        } as any;
        const currentUser = { role: UserRole.TRABAJADOR } as User;
        const result = await controller.findAll(query, currentUser);

        expect(getAllUsersUseCase.execute).toHaveBeenCalledWith(
            expect.anything(),
            UserRole.TRABAJADOR,
        );
        expect(result.meta.total).toBe(0);
    });

    // Mantis #333: el administrador cambia el rol de un usuario.
    it('should change a user role and map the role name to the domain enum', async () => {
        const updated = new User(
            2,
            'Ana',
            'García',
            'ana@example.com',
            'hashed',
            new Date('2026-01-01T00:00:00.000Z'),
            UserRole.ADMINISTRADOR,
            UserState.ACTIVO,
            new Date('2026-01-02T00:00:00.000Z'),
        );
        changeUserRoleUseCase.execute.mockResolvedValue(updated);

        const currentUser = { id: 1 } as User;
        const result = await controller.changeRole(
            { id: 2 } as any,
            { rol: 'ADMINISTRADOR' } as any,
            currentUser,
        );

        expect(changeUserRoleUseCase.execute).toHaveBeenCalledWith(
            2,
            UserRole.ADMINISTRADOR,
            1,
        );
        expect(result.rol).toBe('ADMINISTRADOR');
    });
});
