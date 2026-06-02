import { describe, expect, it } from '@jest/globals';
import { UserResponseDto } from '@/modules/users/infrastructure/http/dtos/user-response.dto';
import { PaginatedUserResponseDto } from '@/modules/users/infrastructure/http/dtos/paginated-user-response.dto';
import { ListUsersQueryDto } from '@/modules/users/infrastructure/http/dtos/list-users-query.dto.http';
import { User } from '@/modules/users/domain/entities/user';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('User Response DTOs', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const updatedAt = new Date('2024-01-02T00:00:00.000Z');

    const buildUser = () =>
        new User(
            1,
            'Ana',
            'Paredes',
            'ana@bioactiva.com',
            'hashed-password',
            createdAt,
            UserRole.TRABAJADOR,
            UserState.ACTIVO,
            updatedAt,
        );

    describe('UserResponseDto', () => {
        it('should map from User entity', () => {
            const user = buildUser();
            const dto = new UserResponseDto(user);

            expect(dto.id).toBe(1);
            expect(dto.nombres).toBe('Ana');
            expect(dto.apellidos).toBe('Paredes');
            expect(dto.correo).toBe('ana@bioactiva.com');
            expect(dto.rol).toBe('TRABAJADOR');
            expect(dto.estado).toBe('ACTIVO');
            expect(dto.fechaRegistro).toEqual(createdAt);
        });
    });

    describe('PaginatedUserResponseDto', () => {
        it('should create paginated response with correct metadata', () => {
            const user = buildUser();
            const userDtos = [new UserResponseDto(user)];
            const dto = new PaginatedUserResponseDto(userDtos, 1, 1, 10);

            expect(dto.data).toHaveLength(1);
            expect(dto.meta.page).toBe(1);
            expect(dto.meta.limit).toBe(10);
            expect(dto.meta.total).toBe(1);
            expect(dto.meta.totalPages).toBe(1);
        });

        it('should calculate totalPages correctly', () => {
            const dto = new PaginatedUserResponseDto([], 25, 1, 10);
            expect(dto.meta.totalPages).toBe(3);
        });

        it('should handle page 0 correctly', () => {
            const dto = new PaginatedUserResponseDto([], 0, 0, 10);
            expect(dto.meta.totalPages).toBe(0);
        });
    });

    describe('ListUsersQueryDto', () => {
        it('should create instance with default values', () => {
            const dto = new ListUsersQueryDto();
            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });

        it('should create instance with custom values', () => {
            const dto = new ListUsersQueryDto();
            dto.search = 'Ana';
            dto.role = UserRole.ADMINISTRADOR;
            dto.page = 2;
            dto.limit = 5;
            expect(dto.search).toBe('Ana');
            expect(dto.role).toBe(UserRole.ADMINISTRADOR);
            expect(dto.page).toBe(2);
            expect(dto.limit).toBe(5);
        });
    });
});
