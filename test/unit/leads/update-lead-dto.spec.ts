import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HttpUpdateLeadDto } from '@/modules/leads/infrastructure/http/dto/update-lead.dto.http';

describe('Leads module', () => {
    describe('HttpUpdateLeadDto (Type transforms)', () => {
        it('coerces numeric string idEncargado to a number', async () => {
            const dto = plainToInstance(HttpUpdateLeadDto, {
                idEncargado: '4',
            });

            expect(dto.idEncargado).toBe(4);
            expect(typeof dto.idEncargado).toBe('number');

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('accepts an empty payload because every field is optional', async () => {
            const dto = plainToInstance(HttpUpdateLeadDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('rejects an idEncargado below the minimum', async () => {
            const dto = plainToInstance(HttpUpdateLeadDto, {
                idEncargado: '0',
            });

            const errors = await validate(dto);
            expect(
                errors.some((error) => error.property === 'idEncargado'),
            ).toBe(true);
        });
    });
});
