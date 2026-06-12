import {
    IsEmail,
    IsOptional,
    IsString,
    IsEnum,
    Matches,
    MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';

export class HttpUpdateContactDto {
    @ApiPropertyOptional({
        example: 'Juan',
        description: 'Nombres del contacto',
    })
    @IsString({ message: 'Los nombres deben ser texto.' })
    @IsOptional()
    @MaxLength(90, {
        message: 'Los nombres no deben superar los 90 caracteres.',
    })
    nombres!: string;

    @ApiPropertyOptional({
        example: 'Pérez',
        description: 'Apellidos del contacto',
    })
    @IsString({ message: 'Los apellidos deben ser texto.' })
    @IsOptional()
    @MaxLength(90, {
        message: 'Los apellidos no deben superar los 90 caracteres.',
    })
    apellidos!: string | null;

    @ApiPropertyOptional({ enum: Vocative, example: Vocative.SR })
    @IsEnum(Vocative, { message: 'El vocativo no es un valor válido.' })
    @IsOptional()
    vocativo!: Vocative | null;

    @ApiPropertyOptional({
        example: 'Gerente Comercial',
        description: 'Cargo o posición',
    })
    @IsString({ message: 'El cargo debe ser texto.' })
    @IsOptional()
    @MaxLength(120, {
        message: 'El cargo no debe superar los 120 caracteres.',
    })
    cargo!: string | null;

    @ApiPropertyOptional({
        example: 'juan.perez@empresa.com',
        description: 'Correo principal (único)',
    })
    @IsEmail({}, { message: 'El correo principal no es válido.' })
    @IsOptional()
    @MaxLength(254, {
        message: 'El correo principal no debe superar los 254 caracteres.',
    })
    correo!: string;

    @ApiPropertyOptional({
        example: '+51 987654321',
        description: 'Teléfono de contacto',
    })
    @IsString({ message: 'El teléfono debe ser texto.' })
    @IsOptional()
    @MaxLength(20, {
        message: 'El teléfono no debe superar los 20 caracteres.',
    })
    @Matches(/^\+\d[\d\s]*$/, {
        message:
            'El teléfono debe tener formato internacional: "+" seguido del código de país y el número, p. ej. +51987654321.',
    })
    telefono?: string | null;

    @ApiPropertyOptional({
        example: 'jperez.personal@gmail.com',
        description: 'Correo secundario',
    })
    @IsEmail({}, { message: 'El correo secundario no es válido.' })
    @IsOptional()
    @MaxLength(254, {
        message: 'El correo secundario no debe superar los 254 caracteres.',
    })
    correo2!: string | null;

    @ApiPropertyOptional({
        example: 'Interesado en servicios de I+D',
        description: 'Comentarios adicionales',
    })
    @IsString({ message: 'Los comentarios deben ser texto.' })
    @IsOptional()
    @MaxLength(500, {
        message: 'Los comentarios no deben superar los 500 caracteres.',
    })
    comentarios?: string | null;

    @ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'UUID de la organización',
    })
    @IsString({ message: 'La organización debe ser texto.' })
    @IsOptional()
    idOrganizacion!: string;
}
