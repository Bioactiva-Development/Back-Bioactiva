import { ApiProperty } from '@nestjs/swagger';
import { ContactResponseDto } from '@/modules/contacts/infrastructure/http/dtos/contact-response.dto';

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

export class PaginatedContactResponseDto {
    @ApiProperty({ type: [ContactResponseDto] })
    data: ContactResponseDto[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;

    constructor(
        data: ContactResponseDto[],
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
