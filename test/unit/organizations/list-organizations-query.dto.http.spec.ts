import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListOrganizationsQueryDto } from '@/modules/organizations/infrastructure/http/dtos/list-organizations-query.dto.http';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';

describe('Organizations module', () => {
    describe('ListOrganizationsQueryDto', () => {
        it('applies default page and limit when omitted', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {});
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });

        it('accepts a full valid query', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                term: 'Bioactiva',
                sector: Sector.TECNOLOGIA,
                tamano: Size.MEDIANO,
                tipo: EnterpriseType.EMPRESA_NACIONAL,
                page: '2',
                limit: '25',
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            // @Type(() => Number) convierte los strings a number.
            expect(dto.page).toBe(2);
            expect(dto.limit).toBe(25);
        });

        it('rejects a term longer than 100 chars', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                term: 'a'.repeat(101),
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'term')).toBe(true);
        });

        it('rejects an empty term (Length min 1)', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                term: '',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'term')).toBe(true);
        });

        it('rejects a non-string term', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                term: 123 as unknown as string,
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'term')).toBe(true);
        });

        it('rejects an invalid sector', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                sector: 'NO_EXISTE',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'sector')).toBe(true);
        });

        it('rejects an invalid tamano', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                tamano: 'NO_EXISTE',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'tamano')).toBe(true);
        });

        it('rejects an invalid tipo', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                tipo: 'NO_EXISTE',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'tipo')).toBe(true);
        });

        it('rejects a non-integer page', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                page: 'abc',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'page')).toBe(true);
        });

        it('rejects page below 1 (Min)', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                page: '0',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'page')).toBe(true);
        });

        it('rejects a non-integer limit', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                limit: '1.5',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'limit')).toBe(true);
        });

        it('rejects limit below 1 (Min)', async () => {
            const dto = plainToInstance(ListOrganizationsQueryDto, {
                limit: '0',
            });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'limit')).toBe(true);
        });
    });
});
