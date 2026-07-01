import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangeRoleDto } from '@/modules/users/infrastructure/http/dtos/change-role.dto.http';

describe('Users module', () => {
    describe('ChangeRoleDto', () => {
        it('accepts an assignable role', async () => {
            const dto = plainToInstance(ChangeRoleDto, {
                rol: 'TRABAJADOR',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('accepts the other assignable role', async () => {
            const dto = plainToInstance(ChangeRoleDto, {
                rol: 'ADMINISTRADOR',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('rejects a role outside the assignable list', async () => {
            const dto = plainToInstance(ChangeRoleDto, {
                rol: 'SUPERADMIN',
            });

            const errors = await validate(dto);
            expect(errors.some((error) => error.property === 'rol')).toBe(
                true,
            );
            expect(errors[0].constraints).toMatchObject({
                isIn: 'El rol debe ser ADMINISTRADOR o TRABAJADOR.',
            });
        });
    });
});
