import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';

export class ListOrganizationsQueryDto {
    @ApiPropertyOptional({
        enum: Sector,
        description: 'Filtrar por sector',
        example: 'TECNOLOGIA',
    })
    @IsOptional()
    @IsEnum(Sector)
    sector?: Sector;

    @ApiPropertyOptional({
        enum: Size,
        description: 'Filtrar por tamaño',
        example: 'MEDIANO',
    })
    @IsOptional()
    @IsEnum(Size)
    tamano?: Size;

    @ApiPropertyOptional({
        enum: EnterpriseType,
        description: 'Filtrar por tipo de organización',
        example: 'EMPRESA_NACIONAL',
    })
    @IsOptional()
    @IsEnum(EnterpriseType)
    tipo?: EnterpriseType;

    @ApiPropertyOptional({ description: 'Número de página', default: 1, example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Elementos por página',
        default: 10,
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
