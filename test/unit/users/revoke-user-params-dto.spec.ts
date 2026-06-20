import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RevokeUserParamsDto } from '@/modules/users/infrastructure/http/dtos/revoke-user-params.dto.http';

describe('RevokeUserParamsDto', () => {
    it('coerces a numeric string id via @Type and validates', async () => {
        const dto = plainToInstance(RevokeUserParamsDto, { id: '2' });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.id).toBe(2);
    });

    it('accepts a valid integer id', async () => {
        const dto = plainToInstance(RevokeUserParamsDto, { id: 5 });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.id).toBe(5);
    });

    it('rejects a non-integer id', async () => {
        const dto = plainToInstance(RevokeUserParamsDto, { id: '1.5' });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'id')).toBe(true);
    });

    it('rejects an id below the minimum', async () => {
        const dto = plainToInstance(RevokeUserParamsDto, { id: '0' });
        const errors = await validate(dto);

        expect(errors.some((e) => e.property === 'id')).toBe(true);
    });
});
