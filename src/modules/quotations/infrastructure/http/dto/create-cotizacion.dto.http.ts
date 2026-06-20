import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsInt,
    IsDateString,
    IsNumberString,
    Min,
    Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

export class HttpCreateCotizacionDto {
    @ApiProperty({ example: '2026-06-01T10:00:00.000Z' })
    @IsDateString()
    fechaCot!: string;

    @ApiPropertyOptional({ example: 'Licencia Software Pro' })
    @IsOptional()
    @IsString()
    @Length(1, 120)
    producto?: string | null;

    @ApiProperty({ example: 'Desarrollo Customizado' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 150)
    nombreServicio!: string;

    @ApiProperty({ example: '5000.00' })
    @IsNotEmpty()
    @IsNumberString({ no_symbols: false })
    monto!: string;

    @ApiProperty({ enum: TipoMoneda, example: TipoMoneda.USD })
    @IsEnum(TipoMoneda)
    tipo!: TipoMoneda;

    @ApiPropertyOptional({ example: 'Incluye 3 meses de soporte' })
    @IsOptional()
    @IsString()
    @Length(1, 1000)
    observacion?: string | null;

    @ApiPropertyOptional({ example: 'https://proposal.techcorp.com/cot-001' })
    @IsOptional()
    @IsString()
    @Length(1, 500)
    linkPropuesta?: string | null;

    @ApiProperty({ example: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idLead!: number;

    @ApiProperty({ example: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    idRemitente!: number;
}
