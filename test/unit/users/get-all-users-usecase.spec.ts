import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetAllUsersUseCase } from '@/modules/users/application/use-cases/get-all-users.use-case';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';
import { ListUsersDto } from '@/modules/users/application/dto/list-users.dto';

describe('Users module', () => {
    describe('GetAllUsersUseCase', () => {
        let useCase: GetAllUsersUseCase;
        let mockRepository: any;

        const buildUser = (id: number, name: string, email: string) =>
            new User(
                id,
                name,
                'Last',
                email,
                'hashed',
                new Date(),
                UserRole.TRABAJADOR,
                UserState.ACTIVO,
                new Date(),
            );

        beforeEach(() => {
            mockRepository = {
                findAll: jest.fn(),
                countAll: jest.fn(),
            };

            useCase = new GetAllUsersUseCase(mockRepository);
        });

        it('should return paginated users with default params (admin viewer)', async () => {
            const users = [buildUser(1, 'John', 'john@test.com')];
            mockRepository.findAll.mockResolvedValue(users);
            mockRepository.countAll.mockResolvedValue(1);

            const dto = new ListUsersDto();
            const result = await useCase.execute(dto, UserRole.ADMINISTRADOR);

            expect(result.data).toEqual(users);
            expect(result.total).toBe(1);
            expect(mockRepository.findAll).toHaveBeenCalledWith({
                search: undefined,
                role: undefined,
                estado: undefined,
                page: 1,
                limit: 10,
            });
            expect(mockRepository.countAll).toHaveBeenCalledWith({
                search: undefined,
                role: undefined,
                estado: undefined,
            });
        });

        it('admin can filter by any role', async () => {
            mockRepository.findAll.mockResolvedValue([]);
            mockRepository.countAll.mockResolvedValue(0);

            const dto = new ListUsersDto(
                'john',
                UserRole.ADMINISTRADOR,
                UserState.ACTIVO,
                2,
                5,
            );
            await useCase.execute(dto, UserRole.ADMINISTRADOR);

            expect(mockRepository.findAll).toHaveBeenCalledWith({
                search: 'john',
                role: UserRole.ADMINISTRADOR,
                estado: UserState.ACTIVO,
                page: 2,
                limit: 5,
            });
            expect(mockRepository.countAll).toHaveBeenCalledWith({
                search: 'john',
                role: UserRole.ADMINISTRADOR,
                estado: UserState.ACTIVO,
            });
        });

        it('worker only sees workers, ignoring an incoming role filter', async () => {
            mockRepository.findAll.mockResolvedValue([]);
            mockRepository.countAll.mockResolvedValue(0);

            // El trabajador intenta filtrar por ADMINISTRADOR: se fuerza TRABAJADOR.
            const dto = new ListUsersDto(
                undefined,
                UserRole.ADMINISTRADOR,
                undefined,
                1,
                10,
            );
            await useCase.execute(dto, UserRole.TRABAJADOR);

            expect(mockRepository.findAll).toHaveBeenCalledWith({
                search: undefined,
                role: UserRole.TRABAJADOR,
                estado: undefined,
                page: 1,
                limit: 10,
            });
            expect(mockRepository.countAll).toHaveBeenCalledWith({
                search: undefined,
                role: UserRole.TRABAJADOR,
                estado: undefined,
            });
        });

        it('should handle empty results', async () => {
            mockRepository.findAll.mockResolvedValue([]);
            mockRepository.countAll.mockResolvedValue(0);

            const dto = new ListUsersDto();
            const result = await useCase.execute(dto, UserRole.ADMINISTRADOR);

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should handle repository errors', async () => {
            mockRepository.findAll.mockRejectedValue(new Error('DB error'));

            const dto = new ListUsersDto();
            await expect(
                useCase.execute(dto, UserRole.ADMINISTRADOR),
            ).rejects.toThrow('DB error');
        });
    });
});
