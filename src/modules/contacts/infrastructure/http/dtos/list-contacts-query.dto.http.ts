import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HttpListContactsQueryDto {
    @ApiPropertyOptional({
        description: 'Filtrar por ID de organización',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsString()
    idOrganization?: string;

    @ApiPropertyOptional({
        description: 'Búsqueda textual en nombres, apellidos, correo o cargo',
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    search?: string;

    @ApiPropertyOptional({
        description: 'Número de página',
        default: 1,
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Elementos por página',
        default: 10,
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
