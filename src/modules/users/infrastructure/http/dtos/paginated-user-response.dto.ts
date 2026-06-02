import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/modules/users/infrastructure/http/dtos/user-response.dto';

class PaginationMetaDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    limit: number;

    @ApiProperty({ example: 50 })
    total: number;

    @ApiProperty({ example: 5 })
    totalPages: number;
}

export class PaginatedUserResponseDto {
    @ApiProperty({ type: [UserResponseDto] })
    data: UserResponseDto[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;

    constructor(
        data: UserResponseDto[],
        total: number,
        page: number,
        limit: number,
    ) {
        this.data = data;
        this.meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
}
