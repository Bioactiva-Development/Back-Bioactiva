import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListUsersQueryDto } from '@/modules/users/infrastructure/http/dtos/list-users-query.dto.http';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

describe('ListUsersQueryDto', () => {
    it('applies default page and limit when omitted and validates', async () => {
        const dto = plainToInstance(ListUsersQueryDto, {});
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.page).toBe(1);
        expect(dto.limit).toBe(10);
    });

    it('coerces numeric strings for page and limit via @Type', async () => {
        const dto = plainToInstance(ListUsersQueryDto, {
            page: '3',
            limit: '25',
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.page).toBe(3);
        expect(dto.limit).toBe(25);
    });

    it('accepts a fully populated valid query', async () => {
        const dto = plainToInstance(ListUsersQueryDto, {
            search: 'ana',
            role: UserRole.TRABAJADOR,
            estado: UserState.ACTIVO,
            page: 2,
            limit: 5,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
    });

    it('rejects a search shorter than the minimum length', async () => {
        const dto = plainToInstance(ListUsersQueryDto, { search: '' });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'search')).toBe(true);
    });

    it('rejects a search longer than the maximum length', async () => {
        const dto = plainToInstance(ListUsersQueryDto, {
            search: 'x'.repeat(101),
        });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'search')).toBe(true);
    });

    it('rejects a non-string search', async () => {
        const dto = plainToInstance(ListUsersQueryDto, { search: 123 });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'search')).toBe(true);
    });

    it('rejects an invalid role enum value', async () => {
        const dto = plainToInstance(ListUsersQueryDto, { role: 'GERENTE' });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'role')).toBe(true);
    });

    it('rejects an invalid estado enum value', async () => {
        const dto = plainToInstance(ListUsersQueryDto, { estado: 'BORRADO' });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'estado')).toBe(true);
    });

    it('rejects a non-integer page', async () => {
        const dto = plainToInstance(ListUsersQueryDto, { page: '1.5' });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'page')).toBe(true);
    });

    it('rejects a page below the minimum', async () => {
        const dto = plainToInstance(ListUsersQueryDto, { page: '0' });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'page')).toBe(true);
    });

    it('rejects a limit below the minimum', async () => {
        const dto = plainToInstance(ListUsersQueryDto, { limit: '0' });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'limit')).toBe(true);
    });
});
