import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { UserController } from '@/modules/users/infrastructure/http/user.controller';
import { GetAllUsersUseCase } from '@/modules/users/application/use-cases/get-all-users.use-case';
import { DisableUserUseCase } from '@/modules/users/application/use-cases/disable-user.use-case';
import { EnableUserUseCase } from '@/modules/users/application/use-cases/enable-user.use-case';

describe('UserController', () => {
    let controller: UserController;
    let getAllUsersUseCase: jest.Mocked<GetAllUsersUseCase>;

    beforeEach(async () => {
        getAllUsersUseCase = { execute: jest.fn() } as any;

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
            ],
        }).compile();

        controller = module.get(UserController);
    });

    it('should list users with pagination', async () => {
        getAllUsersUseCase.execute.mockResolvedValue({
            data: [],
            total: 0,
        });

        const query = { page: 1, limit: 10 } as any;
        const result = await controller.findAll(query);

        expect(getAllUsersUseCase.execute).toHaveBeenCalled();
        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
    });

    it('should list users with search and role filter', async () => {
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
        const result = await controller.findAll(query);

        expect(getAllUsersUseCase.execute).toHaveBeenCalled();
        expect(result.meta.total).toBe(0);
    });
});
