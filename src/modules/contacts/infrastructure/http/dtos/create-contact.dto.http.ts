import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsEnum,
    Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Vocative } from '@/modules/contacts/domain/enums/vocative';

export class HttpCreateContactDto {
    @ApiProperty({ example: 'Juan', description: 'Nombres del contacto' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 90)
    nombres!: string;

    @ApiPropertyOptional({
        example: 'Pérez',
        description: 'Apellidos del contacto',
    })
    @IsString()
    @IsOptional()
    @Length(1, 90)
    apellidos!: string | null;

    @ApiPropertyOptional({ enum: Vocative, example: Vocative.SR })
    @IsEnum(Vocative)
    @IsOptional()
    vocativo!: Vocative | null;

    @ApiPropertyOptional({
        example: 'Gerente Comercial',
        description: 'Cargo o posición',
    })
    @IsString()
    @IsOptional()
    @Length(1, 120)
    cargo!: string | null;

    @ApiProperty({
        example: 'juan.perez@empresa.com',
        description: 'Correo principal (único)',
    })
    @IsEmail()
    @IsNotEmpty()
    @Length(1, 254)
    correo!: string;

    @ApiPropertyOptional({
        example: '+51 987654321',
        description: 'Teléfono de contacto',
    })
    @IsString()
    @IsOptional()
    @Length(1, 20)
    telefono!: string | null;

    @ApiPropertyOptional({
        example: 'jperez.personal@gmail.com',
        description: 'Correo secundario',
    })
    @IsEmail()
    @IsOptional()
    @Length(1, 254)
    correo2!: string | null;

    @ApiPropertyOptional({
        example: 'Interesado en servicios de I+D',
        description: 'Comentarios adicionales',
    })
    @IsString()
    @IsOptional()
    @Length(1, 500)
    comentarios!: string | null;

    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'UUID de la organización',
    })
    @IsString()
    @IsNotEmpty()
    idOrganizacion!: string;
}
