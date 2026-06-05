import { ApiProperty } from '@nestjs/swagger';
import { Organization } from '@/modules/organizations/domain/entities/organization';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

export class OrganizationResponseDto {
    @ApiProperty({ example: 'uuid-org-id' })
    id: string;

    @ApiProperty({ example: 'CLI-001' })
    codigoCliente: string;

    @ApiProperty({ example: 'Bioactiva SAC' })
    nombre: string;

    @ApiProperty({ example: 'Bioactiva' })
    nombreComercial: string;

    @ApiProperty({ example: null, nullable: true })
    subArea: string | null;

    @ApiProperty({ example: '20123456789', nullable: true })
    ruc: string | null;

    @ApiProperty({ enum: EnterpriseType, example: 'EMPRESA_NACIONAL' })
    tipo: EnterpriseType;

    @ApiProperty({ example: null, nullable: true })
    linkedin: string | null;

    @ApiProperty({ example: null, nullable: true })
    ubicacion: string | null;

    @ApiProperty({ enum: Sector, example: 'TECNOLOGIA', nullable: true })
    sector: Sector | null;

    @ApiProperty({ enum: Size, example: 'MEDIANO' })
    tamano: Size;

    @ApiProperty({ example: null, nullable: true })
    actividadEconomica: string | null;

    @ApiProperty({ example: null, nullable: true })
    alianzasEstrategicas: string | null;

    @ApiProperty({ example: 1, nullable: true })
    idContactoActivo: number | null;

    @ApiProperty({ example: 1 })
    idAuthor: number;

    @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
    updatedAt: Date;

    constructor(org: Organization) {
        this.id = org.id;
        this.codigoCliente = org.codigoCliente;
        this.nombre = org.nombre;
        this.nombreComercial = org.nombreComercial;
        this.subArea = org.subArea;
        this.ruc = org.ruc;
        this.tipo = org.tipo;
        this.linkedin = org.linkedin;
        this.ubicacion = org.ubicacion;
        this.sector = org.sector;
        this.tamano = org.tamano;
        this.actividadEconomica = org.actividadEconomica;
        this.alianzasEstrategicas = org.alianzasEstrategicas;
        this.idContactoActivo = org.idContactoActivo;
        this.idAuthor = org.idAuthor;
        this.createdAt = org.createdAt;
        this.updatedAt = org.updatedAt;
    }
}
