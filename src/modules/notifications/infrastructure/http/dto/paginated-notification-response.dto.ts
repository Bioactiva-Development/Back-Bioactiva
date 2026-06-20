import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from '@/modules/notifications/infrastructure/http/dto/notification-response.dto';

class PaginationMetaDto {
    @ApiProperty({ example: 1 }) page!: number;
    @ApiProperty({ example: 10 }) limit!: number;
    @ApiProperty({ example: 50 }) total!: number;
    @ApiProperty({ example: 5 }) totalPages!: number;
}

export class PaginatedNotificationResponseDto {
    @ApiProperty({ type: [NotificationResponseDto] })
    data!: NotificationResponseDto[];
    @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;

    constructor(
        data: NotificationResponseDto[],
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
