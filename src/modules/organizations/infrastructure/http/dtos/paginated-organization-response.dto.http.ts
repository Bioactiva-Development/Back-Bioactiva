import { ApiProperty } from '@nestjs/swagger';
import { OrganizationResponseDto } from '@/modules/organizations/infrastructure/http/dtos/organization-response.dto.http';

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

export class PaginatedOrganizationResponseDto {
    @ApiProperty({ type: [OrganizationResponseDto] })
    data: OrganizationResponseDto[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;

    constructor(
        data: OrganizationResponseDto[],
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
