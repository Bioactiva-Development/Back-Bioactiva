import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class RevokeUserParamsDto {
    @ApiProperty({ description: 'ID del usuario a revocar', example: 2 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id: number;
}
