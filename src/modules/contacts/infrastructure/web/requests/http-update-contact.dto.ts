import {
    IsEmail,
    
    IsOptional,
    IsString,
    IsEnum,
    IsNumber,
    Length,
} from 'class-validator';
import { Vocative } from '../../../domain/enums/vocative';

export class HttpUpdateContactDto {
    @IsString()
    @IsOptional()
    @Length(1, 90)
    nombres!: string; //sin constructor porque nestjs no recomiendo para los dtos

    @IsString()
    @IsOptional()
    @Length(1, 90)
    apellidos!: string | null;

    @IsEnum(Vocative)
    @IsOptional()
    vocativo!: Vocative | null;

    @IsString()
    @IsOptional()
    @Length(1, 120)
    cargo!: string | null;

    @IsEmail()
    @IsOptional()
    @Length(1, 254)
    correo!: string;

    @IsString()
    @IsOptional()
    @Length(1, 20)
    telefono!: string | null;

    @IsEmail()
    @IsOptional()
    @Length(1, 254)
    correo2!: string | null;

    @IsString()
    @IsOptional()
    @Length(1, 500)
    comentarios!: string | null;

    @IsString()
    @IsOptional()
    idOrganizacion!: string; // UUID recibido del frontend

    @IsNumber()
    @IsOptional()
    idAuthor!: number;
}
