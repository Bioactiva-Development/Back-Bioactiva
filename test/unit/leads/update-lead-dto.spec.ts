import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HttpUpdateLeadDto } from '@/modules/leads/infrastructure/http/dto/update-lead.dto.http';

describe('Leads module', () => {
    describe('HttpUpdateLeadDto (Type transforms)', () => {
        it('coerces numeric string idContacto and idEncargado to numbers', async () => {
            const dto = plainToInstance(HttpUpdateLeadDto, {
                idContacto: '13',
                idEncargado: '4',
            });

            expect(dto.idContacto).toBe(13);
            expect(dto.idEncargado).toBe(4);
            expect(typeof dto.idContacto).toBe('number');
            expect(typeof dto.idEncargado).toBe('number');

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('accepts an empty payload because every field is optional', async () => {
            const dto = plainToInstance(HttpUpdateLeadDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('rejects an idContacto below the minimum', async () => {
            const dto = plainToInstance(HttpUpdateLeadDto, {
                idContacto: '0',
            });

            const errors = await validate(dto);
            expect(
                errors.some((error) => error.property === 'idContacto'),
            ).toBe(true);
        });
    });
});
