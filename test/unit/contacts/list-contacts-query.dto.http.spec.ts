import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HttpListContactsQueryDto } from '@/modules/contacts/infrastructure/http/dtos/list-contacts-query.dto.http';

describe('Contacts module', () => {
    describe('HttpListContactsQueryDto', () => {
        it('applies default page and limit when omitted', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {});
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });

        it('accepts a full valid query', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {
                search: 'john',
                page: '3',
                limit: '50',
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            // @Type(() => Number) convierte los strings a number.
            expect(dto.page).toBe(3);
            expect(dto.limit).toBe(50);
        });

        it('rejects a search longer than 100 chars', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {
                search: 'a'.repeat(101),
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'search')).toBe(true);
        });

        it('rejects an empty search (Length min 1)', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {
                search: '',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'search')).toBe(true);
        });

        it('rejects a non-string search', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {
                search: 123 as unknown as string,
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'search')).toBe(true);
        });

        it('rejects a non-integer page', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {
                page: 'abc',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'page')).toBe(true);
        });

        it('rejects page below 1 (Min)', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {
                page: '0',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'page')).toBe(true);
        });

        it('rejects a non-integer limit', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {
                limit: '1.5',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'limit')).toBe(true);
        });

        it('rejects limit below 1 (Min)', async () => {
            const dto = plainToInstance(HttpListContactsQueryDto, {
                limit: '0',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'limit')).toBe(true);
        });
    });
});
