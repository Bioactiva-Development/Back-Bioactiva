import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HttpCreateLeadDto } from '@/modules/leads/infrastructure/http/dto/create-lead.dto.http';

describe('Leads module', () => {
    describe('HttpCreateLeadDto (Type transforms)', () => {
        it('coerces numeric string idContacto and idEncargado to numbers', async () => {
            const dto = plainToInstance(HttpCreateLeadDto, {
                idOrg: '123e4567-e89b-12d3-a456-426614174000',
                idContacto: '42',
                servicioInteres: 'Consultoría',
                idEncargado: '7',
            });

            expect(dto.idContacto).toBe(42);
            expect(dto.idEncargado).toBe(7);
            expect(typeof dto.idContacto).toBe('number');
            expect(typeof dto.idEncargado).toBe('number');

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('rejects a payload missing the required idEncargado', async () => {
            const dto = plainToInstance(HttpCreateLeadDto, {
                idOrg: '123e4567-e89b-12d3-a456-426614174000',
                servicioInteres: 'Consultoría',
            });

            const errors = await validate(dto);
            expect(
                errors.some((error) => error.property === 'idEncargado'),
            ).toBe(true);
        });

        it('rejects an idEncargado below the minimum', async () => {
            const dto = plainToInstance(HttpCreateLeadDto, {
                idOrg: '123e4567-e89b-12d3-a456-426614174000',
                servicioInteres: 'Consultoría',
                idEncargado: '0',
            });

            const errors = await validate(dto);
            expect(
                errors.some((error) => error.property === 'idEncargado'),
            ).toBe(true);
        });
    });
});
