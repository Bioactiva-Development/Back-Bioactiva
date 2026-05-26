import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsEnum,
    IsNumber,
    Length,
} from 'class-validator';
import { EnterpriseType } from '../../../domain/enums/organization-type';
import { Sector } from '../../../domain/enums/sector';
import { Size } from '../../../domain/enums/size';

export class HttpCreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 20)
    codigoCliente!: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 120)
    nombre!: string; // Razón Social

    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    nombreComercial!: string;

    @IsString()
    @IsOptional()
    @Length(1, 60)
    subArea!: string | null;

    @IsString()
    @IsOptional()
    @Length(11, 11)
    ruc!: string | null;

    @IsEnum(EnterpriseType)
    @IsNotEmpty()
    tipo!: EnterpriseType;

    @IsString()
    @IsOptional()
    @Length(1, 255)
    linkedin!: string | null;

    @IsString()
    @IsOptional()
    @Length(1, 100)
    ubicacion!: string | null;

    @IsEnum(Sector)
    @IsOptional()
    sector!: Sector | null;

    @IsEnum(Size)
    @IsNotEmpty()
    tamano!: Size;

    @IsString()
    @IsOptional()
    @Length(1, 120)
    actividadEconomica!: string | null;

    @IsString()
    @IsOptional()
    @Length(1, 300)
    alianzasEstrategicas!: string | null;

    @IsNumber()
    @IsOptional()
    idContactoActivo!: number | null;

    @IsNumber()
    @IsNotEmpty()
    idAuthor!: number;
}
