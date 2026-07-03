import { ApiPropertyOptional } from '@nestjs/swagger';
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
    @ApiPropertyOptional({
        description: 'Código de cliente único para el sistema',
        example: 'CLI-0001',
    })
    @IsString({ message: 'El código de cliente debe ser texto.' })
    @IsOptional()
    @Length(1, 20, {
        message: 'El código de cliente debe tener entre 1 y 20 caracteres.',
    })
    codigoCliente?: string;

    @ApiPropertyOptional({
        description: 'Razón social de la organización',
        example: 'Bioactiva S.A.C.',
    })
    @IsString({ message: 'El nombre (razón social) debe ser texto.' })
    @IsOptional()
    @Length(1, 120, {
        message:
            'El nombre (razón social) debe tener entre 1 y 120 caracteres.',
    })
    nombre?: string; // Razón Social

    @ApiPropertyOptional({
        description: 'Nombre comercial de la organización',
        example: 'Bioactiva',
    })
    @IsString({ message: 'El nombre comercial debe ser texto.' })
    @IsOptional()
    @Length(1, 100, {
        message: 'El nombre comercial debe tener entre 1 y 100 caracteres.',
    })
    nombreComercial?: string;

    @ApiPropertyOptional({
        description: 'Subárea o departamento dentro de la organización',
        example: 'Compras',
        nullable: true,
    })
    @IsString({ message: 'La subárea debe ser texto.' })
    @IsOptional()
    @Length(1, 60, {
        message: 'La subárea debe tener entre 1 y 60 caracteres.',
    })
    subArea?: string | null;

    @ApiPropertyOptional({
        description:
            'RUC de la organización (11 dígitos). Se valida contra SUNAT antes de aplicarse.',
        example: '20123456789',
        nullable: true,
    })
    @IsString({ message: 'El RUC debe ser texto.' })
    @IsOptional()
    @Length(11, 11, {
        message: 'El RUC debe tener exactamente 11 caracteres.',
    })
    ruc?: string | null;

    @ApiPropertyOptional({
        enum: EnterpriseType,
        description: 'Tipo de empresa',
    })
    @IsEnum(EnterpriseType, {
        message: 'El tipo de empresa no es un valor válido.',
    })
    @IsOptional()
    tipo?: EnterpriseType;

    @ApiPropertyOptional({
        description: 'URL del perfil de LinkedIn',
        example: 'https://linkedin.com/company/bioactiva',
        nullable: true,
    })
    @IsString({ message: 'El LinkedIn debe ser texto.' })
    @IsOptional()
    @Length(1, 255, {
        message: 'El LinkedIn debe tener entre 1 y 255 caracteres.',
    })
    linkedin?: string | null;

    @ApiPropertyOptional({
        description: 'Ubicación de la organización',
        example: 'Lima, Perú',
        nullable: true,
    })
    @IsString({ message: 'La ubicación debe ser texto.' })
    @IsOptional()
    @Length(1, 100, {
        message: 'La ubicación debe tener entre 1 y 100 caracteres.',
    })
    ubicacion?: string | null;

    @ApiPropertyOptional({ enum: Sector, description: 'Sector económico' })
    @IsEnum(Sector, { message: 'El sector no es un valor válido.' })
    @IsOptional()
    sector?: Sector;

    @ApiPropertyOptional({
        enum: Size,
        description: 'Tamaño de la organización',
    })
    @IsEnum(Size, { message: 'El tamaño no es un valor válido.' })
    @IsOptional()
    tamano?: Size;

    @ApiPropertyOptional({
        description: 'Actividad económica principal',
        example: 'Agroindustria',
        nullable: true,
    })
    @IsString({ message: 'La actividad económica debe ser texto.' })
    @IsOptional()
    @Length(1, 120, {
        message: 'La actividad económica debe tener entre 1 y 120 caracteres.',
    })
    actividadEconomica?: string | null;

    @ApiPropertyOptional({
        description: 'Alianzas estratégicas de la organización',
        nullable: true,
    })
    @IsString({ message: 'Las alianzas estratégicas deben ser texto.' })
    @IsOptional()
    @Length(1, 300, {
        message:
            'Las alianzas estratégicas deben tener entre 1 y 300 caracteres.',
    })
    alianzasEstrategicas?: string | null;

    @ApiPropertyOptional({
        description: 'ID del contacto activo/principal de la organización',
        example: 1,
        nullable: true,
    })
    @IsNumber({}, { message: 'El contacto activo debe ser un número.' })
    @IsOptional()
    idContactoActivo?: number | null;

    @ApiPropertyOptional({
        description: 'ID del usuario que realiza la actualización',
        example: 1,
    })
    @IsNumber({}, { message: 'El autor debe ser un número.' })
    @IsOptional()
    idAuthor?: number;
}
