import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

const toBool = ({ value }: { value: unknown }) =>
    value === true || value === 'true' || value === '1';

export class ExportOrganizacionesQueryDto {
    /** Incluir organizaciones desactivadas (soft-delete). Por defecto false. */
    @IsOptional()
    @Transform(toBool)
    @IsBoolean()
    includeDeleted?: boolean;

    /** Coincidencia parcial en nombre o nombre comercial. */
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    ruc?: string;

    /** Etiqueta ("Agrícola") o valor de enum ("AGRICOLA"). */
    @IsOptional()
    @IsString()
    sector?: string;

    @IsOptional()
    @IsString()
    tipo?: string;

    @IsOptional()
    @IsString()
    tamano?: string;
}

export class ExportContactosQueryDto {
    /** Coincidencia parcial en nombres o apellidos. */
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    correo?: string;

    /** Coincidencia parcial en el nombre de la organización asociada. */
    @IsOptional()
    @IsString()
    organizacion?: string;
}

export class ExportLeadsQueryDto {
    /** Etiqueta ("Nuevo") o valor de enum ("EN_PROSPECTO"). */
    @IsOptional()
    @IsString()
    estado?: string;

    /** Coincidencia parcial en el servicio de interés. */
    @IsOptional()
    @IsString()
    servicio?: string;

    @IsOptional()
    @IsString()
    organizacion?: string;
}

export class ExportCotizacionesQueryDto {
    @IsOptional()
    @IsString()
    cliente?: string;

    /** Coincidencia parcial en el nombre del servicio. */
    @IsOptional()
    @IsString()
    servicio?: string;

    /** Etiqueta ("Aceptada") o valor de enum ("ACEPTADA"). */
    @IsOptional()
    @IsString()
    estado?: string;
}

export class ExportAllQueryDto {
    @IsOptional()
    @Transform(toBool)
    @IsBoolean()
    includeDeleted?: boolean;
}
