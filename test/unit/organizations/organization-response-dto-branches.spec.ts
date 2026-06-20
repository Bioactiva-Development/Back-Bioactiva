import { describe, expect, it } from '@jest/globals';
import { OrganizationResponseDto } from '@/modules/organizations/infrastructure/http/dtos/organization-response.dto.http';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

describe('Organizations module', () => {
    describe('OrganizationResponseDto — optional fields', () => {
        const build = (overrides: Partial<Organization> = {}) =>
            Object.assign(
                new Organization(
                    'org-1',
                    'CLI-001',
                    'Bioactiva SAC',
                    'Bioactiva',
                    null,
                    null,
                    EnterpriseType.EMPRESA_NACIONAL,
                    null,
                    null,
                    null,
                    Size.MEDIANO,
                    null,
                    null,
                    null,
                    1,
                    new Date('2026-01-15T10:30:00.000Z'),
                    new Date('2026-01-15T10:30:00.000Z'),
                ),
                overrides,
            );

        it('maps null optional fields as null', () => {
            const dto = new OrganizationResponseDto(build());
            expect(dto.subArea).toBeNull();
            expect(dto.ruc).toBeNull();
            expect(dto.linkedin).toBeNull();
            expect(dto.ubicacion).toBeNull();
            expect(dto.sector).toBeNull();
            expect(dto.actividadEconomica).toBeNull();
            expect(dto.alianzasEstrategicas).toBeNull();
            expect(dto.idContactoActivo).toBeNull();
        });

        it('maps populated optional fields', () => {
            const dto = new OrganizationResponseDto(
                build({
                    subArea: 'Tech',
                    ruc: '20123456789',
                    linkedin: 'https://linkedin/x',
                    ubicacion: 'Lima',
                    sector: Sector.TECNOLOGIA,
                    actividadEconomica: 'Software',
                    alianzasEstrategicas: 'Partners',
                    idContactoActivo: 7,
                }),
            );
            expect(dto.subArea).toBe('Tech');
            expect(dto.ruc).toBe('20123456789');
            expect(dto.linkedin).toBe('https://linkedin/x');
            expect(dto.ubicacion).toBe('Lima');
            expect(dto.sector).toBe(Sector.TECNOLOGIA);
            expect(dto.actividadEconomica).toBe('Software');
            expect(dto.alianzasEstrategicas).toBe('Partners');
            expect(dto.idContactoActivo).toBe(7);
            expect(dto.tipo).toBe(EnterpriseType.EMPRESA_NACIONAL);
            expect(dto.tamano).toBe(Size.MEDIANO);
        });
    });
});
