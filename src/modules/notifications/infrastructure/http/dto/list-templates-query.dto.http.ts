import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListTemplatesQueryDto {
    @ApiPropertyOptional({
        example: false,
        description: 'Incluir también las plantillas inactivas',
    })
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    includeInactive?: boolean;
}
