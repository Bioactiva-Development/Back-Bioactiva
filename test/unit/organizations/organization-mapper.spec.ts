import { describe, expect, it } from '@jest/globals';
import { OrganizationMapper } from '@/modules/organizations/infrastructure/mapper/organization.mapper';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Size } from '@/modules/organizations/domain/enums/size';
import { Sector } from '@/modules/organizations/domain/enums/sector';

describe('Organizations module', () => {
    /**
     * OrganizationMapper
     * ----------
     * Responsable de:
     * - mapear tipos de empresa (TipoEmpresa) en ambas direcciones
     * - mapear tamaños de organización (Tamano) en ambas direcciones
     * - mapear sectores económicos en ambas direcciones
     * - manejar valores nulos en sector
     * - preservar bidireccionalidad en conversiones
     */
    // STATUS: Implementación completa (todos los mapeos de enums).
    describe('OrganizationMapper', () => {
        const mockOrgData = {
            id: 'org-1',
            codigoCliente: 'CLI-001',
            nombre: 'Tech Corp Peru',
            nombreComercial: 'TechCorp',
            subArea: 'Technology',
            ruc: '20123456789',
            tipo: 'EMPRESA_NACIONAL' as const,
            linkedin: 'https://linkedin.com/company/techcorp',
            ubicacion: 'Lima, Peru',
            sector: 'TECNOLOGIA' as const,
            tamano: 'GRANDE' as const,
            actividadEconomica: 'Software Development',
            alianzasEstrategicas: 'Microsoft, Google',
            idContactoActivo: 1,
            idAuthor: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            deletedAt: null,
        };

        describe('toDomain - Enterprise Type', () => {
            it('should map all enterprise types correctly', () => {
                const types: Array<[typeof mockOrgData.tipo, EnterpriseType]> =
                    [
                        ['ACADEMIA', EnterpriseType.ACADEMIA],
                        [
                            'EMPRESA_INTERNACIONAL',
                            EnterpriseType.EMPRESA_INTERNACIONAL,
                        ],
                        ['EMPRESA_NACIONAL', EnterpriseType.EMPRESA_NACIONAL],
                        ['GOBIERNO_NACIONAL', EnterpriseType.GOBIERNO_NACIONAL],
                        ['INDEPENDIENTE', EnterpriseType.INDEPENDIENTE],
                        ['ONG', EnterpriseType.ONG],
                        [
                            'ORGANISMO_INTERNACIONAL',
                            EnterpriseType.ORGANISMO_INTERNACIONAL,
                        ],
                    ];

                types.forEach(([prismaType, expectedType]) => {
                    const result = OrganizationMapper.toDomain({
                        ...mockOrgData,
                        tipo: prismaType,
                    });
                    expect(result.tipo).toBe(expectedType);
                });
            });
        });

        describe('toDomain - Size', () => {
            it('should map all size types correctly', () => {
                const sizes: Array<[typeof mockOrgData.tamano, Size]> = [
                    ['GRANDE', Size.GRANDE],
                    ['MEDIANO', Size.MEDIANO],
                    ['PEQUENO', Size.PEQUENO],
                    ['MICRO', Size.MICRO],
                ];

                sizes.forEach(([prismaSize, expectedSize]) => {
                    const result = OrganizationMapper.toDomain({
                        ...mockOrgData,
                        tamano: prismaSize,
                    });
                    expect(result.tamano).toBe(expectedSize);
                });
            });
        });

        describe('toDomain - Sector', () => {
            it('should map all sector types correctly', () => {
                const sectors: Array<[typeof mockOrgData.sector, Sector]> = [
                    ['ACUICULTURA', Sector.ACUICULTURA],
                    ['TECNOLOGIA', Sector.TECNOLOGIA],
                    ['EDUCACION', Sector.EDUCACION],
                    ['SALUD', Sector.SALUD],
                    ['ENERGIA', Sector.ENERGIA],
                    ['TURISMO', Sector.TURISMO],
                ];

                sectors.forEach(([prismaSector, expectedSector]) => {
                    const result = OrganizationMapper.toDomain({
                        ...mockOrgData,
                        sector: prismaSector,
                    });
                    expect(result.sector).toBe(expectedSector);
                });
            });

            it('should handle null sector', () => {
                const result = OrganizationMapper.toDomain({
                    ...mockOrgData,
                    sector: null,
                });
                expect(result.sector).toBeNull();
            });
        });

        describe('toDomain - Full conversion', () => {
            it('should convert complete Prisma model to domain entity', () => {
                const result = OrganizationMapper.toDomain(mockOrgData);

                expect(result).toBeInstanceOf(Organization);
                expect(result.id).toBe('org-1');
                expect(result.nombre).toBe('Tech Corp Peru');
                expect(result.ruc).toBe('20123456789');
                expect(result.tipo).toBe(EnterpriseType.EMPRESA_NACIONAL);
                expect(result.tamano).toBe(Size.GRANDE);
                expect(result.sector).toBe(Sector.TECNOLOGIA);
            });

            it('should preserve all fields', () => {
                const result = OrganizationMapper.toDomain(mockOrgData);

                expect(result.codigoCliente).toBe('CLI-001');
                expect(result.nombreComercial).toBe('TechCorp');
                expect(result.linkedin).toBe(
                    'https://linkedin.com/company/techcorp',
                );
                expect(result.ubicacion).toBe('Lima, Peru');
                expect(result.idAuthor).toBe(1);
            });
        });

        describe('toPersistence', () => {
            it('should convert domain entity to Prisma format', () => {
                const domainOrg = new Organization(
                    'org-1',
                    'CLI-001',
                    'Tech Corp Peru',
                    'TechCorp',
                    'Technology',
                    '20123456789',
                    EnterpriseType.EMPRESA_NACIONAL,
                    'https://linkedin.com/company/techcorp',
                    'Lima, Peru',
                    Sector.TECNOLOGIA,
                    Size.GRANDE,
                    'Software Development',
                    'Microsoft, Google',
                    1,
                    1,
                    new Date('2024-01-01'),
                    new Date('2024-01-01'),
                );

                const result = OrganizationMapper.toPersistence(domainOrg);

                expect(result.tipo).toBe('EMPRESA_NACIONAL');
                expect(result.tamano).toBe('GRANDE');
                expect(result.sector).toBe('TECNOLOGIA');
            });

            it('should exclude id, createdAt, updatedAt from persistence', () => {
                const domainOrg = new Organization(
                    'org-1',
                    'CLI-001',
                    'Tech Corp Peru',
                    'TechCorp',
                    'Technology',
                    '20123456789',
                    EnterpriseType.EMPRESA_NACIONAL,
                    '',
                    '',
                    Sector.TECNOLOGIA,
                    Size.GRANDE,
                    '',
                    '',
                    null,
                    1,
                    new Date('2024-01-01'),
                    new Date('2024-01-01'),
                );

                const result = OrganizationMapper.toPersistence(domainOrg);

                expect(result).not.toHaveProperty('id');
                expect(result).not.toHaveProperty('createdAt');
                expect(result).not.toHaveProperty('updatedAt');
            });

            it('should map null sector to null in persistence', () => {
                const domainOrg = new Organization(
                    'org-2',
                    'CLI-002',
                    'Test Corp',
                    'Test',
                    null,
                    '20123456788',
                    EnterpriseType.EMPRESA_NACIONAL,
                    null,
                    null,
                    null,
                    Size.MICRO,
                    null,
                    null,
                    null,
                    1,
                    new Date(),
                    new Date(),
                );

                const result = OrganizationMapper.toPersistence(domainOrg);

                expect(result.sector).toBeNull();
            });
        });

        describe('bidirectional conversion', () => {
            it('should preserve enterprise type through round-trip', () => {
                const original = new Organization(
                    'org-1',
                    'CLI-001',
                    'Tech Corp',
                    'TechCorp',
                    'Tech',
                    '20123456789',
                    EnterpriseType.EMPRESA_NACIONAL,
                    '',
                    '',
                    Sector.TECNOLOGIA,
                    Size.GRANDE,
                    '',
                    '',
                    null,
                    1,
                    new Date(),
                    new Date(),
                );

                const toPersistence =
                    OrganizationMapper.toPersistence(original);
                const reconstructed = OrganizationMapper.toDomain({
                    ...toPersistence,
                    id: original.id,
                    createdAt: original.createdAt,
                    updatedAt: original.updatedAt,
                    deletedAt: original.deletedAt,
                });

                expect(reconstructed.tipo).toBe(original.tipo);
                expect(reconstructed.tamano).toBe(original.tamano);
                expect(reconstructed.sector).toBe(original.sector);
            });
        });
    });
});
