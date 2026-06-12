import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

export class ListUsersQueryDto {
    @ApiPropertyOptional({
        description: 'Búsqueda por nombre o correo electrónico',
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    search?: string;

    @ApiPropertyOptional({
        enum: UserRole,
        description: 'Filtrar por rol',
        example: 'TRABAJADOR',
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({
        enum: UserState,
        description: 'Filtrar por estado',
        example: 'ACTIVO',
    })
    @IsOptional()
    @IsEnum(UserState)
    estado?: UserState;

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
