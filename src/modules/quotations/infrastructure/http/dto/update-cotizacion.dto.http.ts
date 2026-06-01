import { IsOptional, IsString, IsDateString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TipoMoneda } from '@/modules/quotations/domain/enums/tipo-moneda';

export class HttpUpdateCotizacionDto {
    @ApiPropertyOptional({ example: '2026-06-01T10:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    fechaCot?: string;

    @ApiPropertyOptional({ example: 'Dr. Martinez' })
    @IsOptional()
    @IsString()
    @Length(1, 90)
    dirigido?: string;

    @ApiPropertyOptional({ example: 'TechCorp SA' })
    @IsOptional()
    @IsString()
    @Length(1, 120)
    cliente?: string | null;

    @ApiPropertyOptional({ example: 'Licencia Software Pro' })
    @IsOptional()
    @IsString()
    @Length(1, 120)
    producto?: string | null;

    @ApiPropertyOptional({ example: 'Desarrollo Customizado' })
    @IsOptional()
    @IsString()
    @Length(1, 150)
    nombreServicio?: string;

    @ApiPropertyOptional({ example: '5000.00' })
    @IsOptional()
    @IsString()
    monto?: string;

    @ApiPropertyOptional({ enum: TipoMoneda, example: TipoMoneda.USD })
    @IsOptional()
    @IsEnum(TipoMoneda)
    tipo?: TipoMoneda;

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
}
