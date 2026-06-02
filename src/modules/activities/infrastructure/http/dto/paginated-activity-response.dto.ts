import { ApiProperty } from '@nestjs/swagger';
import { ActivityResponseDto } from '@/modules/activities/infrastructure/http/dto/activity-response.dto';

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

export class PaginatedActivityResponseDto {
    @ApiProperty({ type: [ActivityResponseDto] })
    data: ActivityResponseDto[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;

    constructor(
        data: ActivityResponseDto[],
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
