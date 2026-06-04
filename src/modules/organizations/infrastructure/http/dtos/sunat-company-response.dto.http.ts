import { ApiProperty } from '@nestjs/swagger';
import type { SunatCompanyInfo } from '@/modules/organizations/domain/ports/sunat.service';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

export class SunatCompanyResponseDto {
    @ApiProperty({ example: '20123456789' })
    ruc: string;

    @ApiProperty({ example: 'EMPRESA EJEMPLO S.A.' })
    razonSocial: string;

    @ApiProperty({ example: 'Ejemplo Corp' })
    nombreComercial: string;

    @ApiProperty({
        enum: EnterpriseType,
        example: 'EMPRESA_NACIONAL',
        nullable: true,
    })
    tipo: EnterpriseType | null;

    @ApiProperty({ example: 'AV. EJEMPLO 123, LIMA', nullable: true })
    ubicacion: string | null;

    @ApiProperty({ example: 'VENTA AL POR MAYOR DE PRODUCTOS', nullable: true })
    actividadEconomica: string | null;

    @ApiProperty({ enum: Size, example: 'MICRO', nullable: true })
    tamano: Size | null;

    @ApiProperty({ enum: Sector, example: 'OTROS', nullable: true })
    sector: Sector | null;

    constructor(info: SunatCompanyInfo) {
        this.ruc = info.ruc;
        this.razonSocial = info.razonSocial;
        this.nombreComercial = info.nombreComercial;
        this.tipo = info.tipo;
        this.ubicacion = info.ubicacion;
        this.actividadEconomica = info.actividadEconomica;
        this.tamano = info.tamano;
        this.sector = info.sector;
    }
}
