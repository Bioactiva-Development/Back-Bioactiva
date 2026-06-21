import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListLeadsQueryDto } from '@/modules/leads/infrastructure/http/dto/list-leads-query.dto.http';

describe('Leads module', () => {
    describe('ListLeadsQueryDto (Type transforms)', () => {
        it('coerces numeric string idEncargado, page and limit to numbers', async () => {
            const dto = plainToInstance(ListLeadsQueryDto, {
                idEncargado: '3',
                page: '2',
                limit: '25',
            });

            expect(dto.idEncargado).toBe(3);
            expect(dto.page).toBe(2);
            expect(dto.limit).toBe(25);
            expect(typeof dto.idEncargado).toBe('number');
            expect(typeof dto.page).toBe('number');
            expect(typeof dto.limit).toBe('number');

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('coerces the "true" string of misLeads and conActividadesPendientes to booleans', async () => {
            const dto = plainToInstance(ListLeadsQueryDto, {
                misLeads: 'true',
                conActividadesPendientes: 'true',
            });

            expect(dto.misLeads).toBe(true);
            expect(dto.conActividadesPendientes).toBe(true);

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('coerces non-"true" values of the boolean filters to false', async () => {
            const dto = plainToInstance(ListLeadsQueryDto, {
                misLeads: 'false',
                conActividadesPendientes: 'nope',
            });

            expect(dto.misLeads).toBe(false);
            expect(dto.conActividadesPendientes).toBe(false);

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('applies the default page and limit when omitted', async () => {
            const dto = plainToInstance(ListLeadsQueryDto, {});

            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('rejects a page below the minimum', async () => {
            const dto = plainToInstance(ListLeadsQueryDto, {
                page: '0',
            });

            const errors = await validate(dto);
            expect(errors.some((error) => error.property === 'page')).toBe(
                true,
            );
        });

        it('rejects a limit below the minimum', async () => {
            const dto = plainToInstance(ListLeadsQueryDto, {
                limit: '0',
            });

            const errors = await validate(dto);
            expect(errors.some((error) => error.property === 'limit')).toBe(
                true,
            );
        });
    });
});
