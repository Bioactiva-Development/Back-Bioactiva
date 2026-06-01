import { ApiProperty } from '@nestjs/swagger';
import { CotizacionResponseDto } from '@/modules/quotations/infrastructure/http/dto/cotizacion-response.dto';

class PaginationMetaDto {
    @ApiProperty({ example: 1 }) page!: number;
    @ApiProperty({ example: 10 }) limit!: number;
    @ApiProperty({ example: 50 }) total!: number;
    @ApiProperty({ example: 5 }) totalPages!: number;
}

export class PaginatedCotizacionResponseDto {
    @ApiProperty({ type: [CotizacionResponseDto] })
    data!: CotizacionResponseDto[];
    @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;

    constructor(
        data: CotizacionResponseDto[],
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
