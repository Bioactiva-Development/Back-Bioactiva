import {
    IsOptional,
    IsString,
    IsEnum,
    IsNumber,
    Length,
} from 'class-validator';
import { EnterpriseType } from '@/modules/organizations/domain/enums/organization-type';
import { Sector } from '@/modules/organizations/domain/enums/sector';
import { Size } from '@/modules/organizations/domain/enums/size';

export class HttpUpdateOrganizationDto {
    @IsString({ message: 'El código de cliente debe ser texto.' })
    @IsOptional()
    @Length(1, 20, {
        message: 'El código de cliente debe tener entre 1 y 20 caracteres.',
    })
    codigoCliente?: string;

    @IsString({ message: 'El nombre (razón social) debe ser texto.' })
    @IsOptional()
    @Length(1, 120, {
        message:
            'El nombre (razón social) debe tener entre 1 y 120 caracteres.',
    })
    nombre?: string; // Razón Social

    @IsString({ message: 'El nombre comercial debe ser texto.' })
    @IsOptional()
    @Length(1, 100, {
        message: 'El nombre comercial debe tener entre 1 y 100 caracteres.',
    })
    nombreComercial?: string;

    @IsString({ message: 'La subárea debe ser texto.' })
    @IsOptional()
    @Length(1, 60, {
        message: 'La subárea debe tener entre 1 y 60 caracteres.',
    })
    subArea?: string | null;

    @IsString({ message: 'El RUC debe ser texto.' })
    @IsOptional()
    @Length(11, 11, {
        message: 'El RUC debe tener exactamente 11 caracteres.',
    })
    ruc?: string | null;

    @IsEnum(EnterpriseType, {
        message: 'El tipo de empresa no es un valor válido.',
    })
    @IsOptional()
    tipo?: EnterpriseType;

    @IsString({ message: 'El LinkedIn debe ser texto.' })
    @IsOptional()
    @Length(1, 255, {
        message: 'El LinkedIn debe tener entre 1 y 255 caracteres.',
    })
    linkedin?: string | null;

    @IsString({ message: 'La ubicación debe ser texto.' })
    @IsOptional()
    @Length(1, 100, {
        message: 'La ubicación debe tener entre 1 y 100 caracteres.',
    })
    ubicacion?: string | null;

    @IsEnum(Sector, { message: 'El sector no es un valor válido.' })
    @IsOptional()
    sector?: Sector | null;

    @IsEnum(Size, { message: 'El tamaño no es un valor válido.' })
    @IsOptional()
    tamano?: Size;

    @IsString({ message: 'La actividad económica debe ser texto.' })
    @IsOptional()
    @Length(1, 120, {
        message: 'La actividad económica debe tener entre 1 y 120 caracteres.',
    })
    actividadEconomica?: string | null;

    @IsString({ message: 'Las alianzas estratégicas deben ser texto.' })
    @IsOptional()
    @Length(1, 300, {
        message:
            'Las alianzas estratégicas deben tener entre 1 y 300 caracteres.',
    })
    alianzasEstrategicas?: string | null;

    @IsNumber({}, { message: 'El contacto activo debe ser un número.' })
    @IsOptional()
    idContactoActivo?: number | null;

    @IsNumber({}, { message: 'El autor debe ser un número.' })
    @IsOptional()
    idAuthor?: number;
}
