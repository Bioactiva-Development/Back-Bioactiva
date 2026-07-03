import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

const toBool = ({ value }: { value: unknown }) =>
    value === true || value === 'true' || value === '1';

export class ExportOrganizacionesQueryDto {
    @ApiPropertyOptional({
        description: 'Incluir organizaciones desactivadas (soft-delete)',
        default: false,
    })
    @IsOptional()
    @Transform(toBool)
    @IsBoolean()
    includeDeleted?: boolean;

    @ApiPropertyOptional({
        description: 'Coincidencia parcial en nombre o nombre comercial',
    })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiPropertyOptional({ description: 'RUC de la organización' })
    @IsOptional()
    @IsString()
    ruc?: string;

    @ApiPropertyOptional({
        description: 'Etiqueta ("Agrícola") o valor de enum ("AGRICOLA")',
    })
    @IsOptional()
    @IsString()
    sector?: string;

    @ApiPropertyOptional({ description: 'Tipo de empresa' })
    @IsOptional()
    @IsString()
    tipo?: string;

    @ApiPropertyOptional({ description: 'Tamaño de la organización' })
    @IsOptional()
    @IsString()
    tamano?: string;
}

export class ExportContactosQueryDto {
    @ApiPropertyOptional({
        description: 'Coincidencia parcial en nombres o apellidos',
    })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiPropertyOptional({ description: 'Coincidencia parcial en el correo' })
    @IsOptional()
    @IsString()
    correo?: string;

    @ApiPropertyOptional({
        description:
            'Coincidencia parcial en el nombre de la organización asociada',
    })
    @IsOptional()
    @IsString()
    organizacion?: string;
}

export class ExportLeadsQueryDto {
    @ApiPropertyOptional({
        description: 'Etiqueta ("Nuevo") o valor de enum ("EN_PROSPECTO")',
    })
    @IsOptional()
    @IsString()
    estado?: string;

    @ApiPropertyOptional({
        description: 'Coincidencia parcial en el servicio de interés',
    })
    @IsOptional()
    @IsString()
    servicio?: string;

    @ApiPropertyOptional({
        description:
            'Coincidencia parcial en el nombre de la organización asociada',
    })
    @IsOptional()
    @IsString()
    organizacion?: string;
}

export class ExportCotizacionesQueryDto {
    @ApiPropertyOptional({ description: 'Coincidencia parcial en el cliente' })
    @IsOptional()
    @IsString()
    cliente?: string;

    @ApiPropertyOptional({
        description: 'Coincidencia parcial en el nombre del servicio',
    })
    @IsOptional()
    @IsString()
    servicio?: string;

    @ApiPropertyOptional({
        description: 'Etiqueta ("Aceptada") o valor de enum ("ACEPTADA")',
    })
    @IsOptional()
    @IsString()
    estado?: string;
}

export class ExportAllQueryDto {
    @ApiPropertyOptional({
        description: 'Incluir organizaciones desactivadas (soft-delete)',
        default: false,
    })
    @IsOptional()
    @Transform(toBool)
    @IsBoolean()
    includeDeleted?: boolean;
}
