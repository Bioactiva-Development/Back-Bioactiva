import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { CreateCotizacionUseCase } from '@/modules/quotations/application/use-cases/create-cotizacion.use-case';
import { GetCotizacionByIdUseCase } from '@/modules/quotations/application/use-cases/get-cotizacion-by-id.use-case';
import { ListCotizacionesUseCase } from '@/modules/quotations/application/use-cases/list-cotizaciones.use-case';
import { UpdateCotizacionUseCase } from '@/modules/quotations/application/use-cases/update-cotizacion.use-case';
import { SendCotizacionUseCase } from '@/modules/quotations/application/use-cases/send-cotizacion.use-case';
import { AcceptCotizacionUseCase } from '@/modules/quotations/application/use-cases/accept-cotizacion.use-case';
import { RejectCotizacionUseCase } from '@/modules/quotations/application/use-cases/reject-cotizacion.use-case';
import { DeleteCotizacionUseCase } from '@/modules/quotations/application/use-cases/delete-cotizacion.use-case';
import { HttpCreateCotizacionDto } from '@/modules/quotations/infrastructure/http/dto/create-cotizacion.dto.http';
import { HttpUpdateCotizacionDto } from '@/modules/quotations/infrastructure/http/dto/update-cotizacion.dto.http';
import { ListCotizacionesQueryDto } from '@/modules/quotations/infrastructure/http/dto/list-cotizaciones-query.dto.http';
import { CotizacionResponseDto } from '@/modules/quotations/infrastructure/http/dto/cotizacion-response.dto';
import { PaginatedCotizacionResponseDto } from '@/modules/quotations/infrastructure/http/dto/paginated-cotizacion-response.dto';
import { CreateCotizacionDto } from '@/modules/quotations/application/dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from '@/modules/quotations/application/dto/update-cotizacion.dto';
import { ListCotizacionesDto } from '@/modules/quotations/application/dto/list-cotizaciones.dto';

@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotations')
export class CotizacionController {
    constructor(
        private readonly createCotizacionUseCase: CreateCotizacionUseCase,
        private readonly getCotizacionByIdUseCase: GetCotizacionByIdUseCase,
        private readonly listCotizacionesUseCase: ListCotizacionesUseCase,
        private readonly updateCotizacionUseCase: UpdateCotizacionUseCase,
        private readonly sendCotizacionUseCase: SendCotizacionUseCase,
        private readonly acceptCotizacionUseCase: AcceptCotizacionUseCase,
        private readonly rejectCotizacionUseCase: RejectCotizacionUseCase,
        private readonly deleteCotizacionUseCase: DeleteCotizacionUseCase,
    ) {}

    @Post()
    async create(
        @Body() httpDto: HttpCreateCotizacionDto,
        @CurrentUser() user: User,
    ): Promise<CotizacionResponseDto> {
        const dto = new CreateCotizacionDto(
            new Date(httpDto.fechaCot),
            httpDto.dirigido,
            httpDto.cliente ?? null,
            httpDto.producto ?? null,
            httpDto.nombreServicio,
            httpDto.monto,
            httpDto.tipo,
            httpDto.observacion ?? null,
            httpDto.linkPropuesta ?? null,
            httpDto.idLead,
            httpDto.idRemitente,
            user.id!,
        );
        const result = await this.createCotizacionUseCase.execute(dto);
        return new CotizacionResponseDto(result);
    }

    @Get()
    async findAll(
        @Query() query: ListCotizacionesQueryDto,
    ): Promise<PaginatedCotizacionResponseDto> {
        const dto = new ListCotizacionesDto(
            query.idLead,
            query.estado,
            query.idRemitente,
            query.fechaDesde ? new Date(query.fechaDesde) : undefined,
            query.fechaHasta ? new Date(query.fechaHasta) : undefined,
            query.page,
            query.limit,
            query.tipo,
        );
        const { data, total } = await this.listCotizacionesUseCase.execute(dto);
        return new PaginatedCotizacionResponseDto(
            data.map((item) => new CotizacionResponseDto(item)),
            total,
            dto.page,
            dto.limit,
        );
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CotizacionResponseDto> {
        const result = await this.getCotizacionByIdUseCase.execute(id);
        return new CotizacionResponseDto(result);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() httpDto: HttpUpdateCotizacionDto,
    ): Promise<CotizacionResponseDto> {
        const dto = new UpdateCotizacionDto(
            httpDto.fechaCot ? new Date(httpDto.fechaCot) : undefined,
            httpDto.dirigido,
            httpDto.cliente,
            httpDto.producto,
            httpDto.nombreServicio,
            httpDto.monto,
            httpDto.tipo,
            httpDto.observacion,
            httpDto.linkPropuesta,
        );
        const result = await this.updateCotizacionUseCase.execute(id, dto);
        return new CotizacionResponseDto(result);
    }

    @Patch(':id/send')
    async send(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CotizacionResponseDto> {
        const result = await this.sendCotizacionUseCase.execute(id);
        return new CotizacionResponseDto(result);
    }

    @Patch(':id/accept')
    async accept(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CotizacionResponseDto> {
        const result = await this.acceptCotizacionUseCase.execute(id);
        return new CotizacionResponseDto(result);
    }

    @Patch(':id/reject')
    async reject(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CotizacionResponseDto> {
        const result = await this.rejectCotizacionUseCase.execute(id);
        return new CotizacionResponseDto(result);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ ok: boolean }> {
        return await this.deleteCotizacionUseCase.execute(id);
    }
}
