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
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { CreateCotizacionUseCase } from '@/modules/quotations/application/use-cases/create-cotizacion.use-case';
import { GetCotizacionByIdUseCase } from '@/modules/quotations/application/use-cases/get-cotizacion-by-id.use-case';
import { GetKpisCotizacionesUseCase } from '@/modules/quotations/application/use-cases/get-kpis-cotizaciones.use-case';
import { ListCotizacionesUseCase } from '@/modules/quotations/application/use-cases/list-cotizaciones.use-case';
import { UpdateCotizacionUseCase } from '@/modules/quotations/application/use-cases/update-cotizacion.use-case';
import { SendCotizacionUseCase } from '@/modules/quotations/application/use-cases/send-cotizacion.use-case';
import { AcceptCotizacionUseCase } from '@/modules/quotations/application/use-cases/accept-cotizacion.use-case';
import { RejectCotizacionUseCase } from '@/modules/quotations/application/use-cases/reject-cotizacion.use-case';
import { DeleteCotizacionUseCase } from '@/modules/quotations/application/use-cases/delete-cotizacion.use-case';
import { HttpCreateCotizacionDto } from '@/modules/quotations/infrastructure/http/dto/create-cotizacion.dto.http';
import { HttpUpdateCotizacionDto } from '@/modules/quotations/infrastructure/http/dto/update-cotizacion.dto.http';
import { KpisCotizacionesQueryDto } from '@/modules/quotations/infrastructure/http/dto/kpis-cotizaciones-query.dto.http';
import { KpisCotizacionesResponseDto } from '@/modules/quotations/infrastructure/http/dto/kpis-cotizaciones-response.dto';
import { ListCotizacionesQueryDto } from '@/modules/quotations/infrastructure/http/dto/list-cotizaciones-query.dto.http';
import { CotizacionResponseDto } from '@/modules/quotations/infrastructure/http/dto/cotizacion-response.dto';
import { PaginatedCotizacionResponseDto } from '@/modules/quotations/infrastructure/http/dto/paginated-cotizacion-response.dto';
import { CreateCotizacionDto } from '@/modules/quotations/application/dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from '@/modules/quotations/application/dto/update-cotizacion.dto';
import { ListCotizacionesDto } from '@/modules/quotations/application/dto/list-cotizaciones.dto';
import { AppTimeConfig } from '@/shared/infrastructure/config/app-time.config';
import {
    startOfDayInZone,
    endOfDayInZone,
} from '@/shared/infrastructure/datetime/range-in-zone';

@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotations')
export class CotizacionController {
    constructor(
        private readonly createCotizacionUseCase: CreateCotizacionUseCase,
        private readonly getCotizacionByIdUseCase: GetCotizacionByIdUseCase,
        private readonly getKpisCotizacionesUseCase: GetKpisCotizacionesUseCase,
        private readonly listCotizacionesUseCase: ListCotizacionesUseCase,
        private readonly updateCotizacionUseCase: UpdateCotizacionUseCase,
        private readonly sendCotizacionUseCase: SendCotizacionUseCase,
        private readonly acceptCotizacionUseCase: AcceptCotizacionUseCase,
        private readonly rejectCotizacionUseCase: RejectCotizacionUseCase,
        private readonly deleteCotizacionUseCase: DeleteCotizacionUseCase,
        private readonly appTime: AppTimeConfig,
    ) {}

    @Post()
    @ApiOperation({
        summary: 'Crear una cotización para un lead',
        description:
            'El cliente y el dirigido se derivan del lead (organización y contacto asociados). Si el lead está EN_PROSPECTO, lo promueve a OFERTADO (requiere que no tenga actividades pendientes).',
    })
    @ApiResponse({
        status: 201,
        description: 'Cotización creada exitosamente',
        type: CotizacionResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description: 'Lead o remitente no encontrado',
    })
    @ApiResponse({
        status: 409,
        description:
            'El lead ya tiene una cotización, o tiene actividades pendientes que deben resolverse antes de promoverlo a OFERTADO',
    })
    async create(
        @Body() httpDto: HttpCreateCotizacionDto,
        @CurrentUser() user: User,
    ): Promise<CotizacionResponseDto> {
        const dto = new CreateCotizacionDto(
            startOfDayInZone(httpDto.fechaCot, this.appTime.timeZone),
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
    @ApiOperation({ summary: 'Listar cotizaciones con filtros y paginación' })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de cotizaciones',
        type: PaginatedCotizacionResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async findAll(
        @Query() query: ListCotizacionesQueryDto,
    ): Promise<PaginatedCotizacionResponseDto> {
        const dto = new ListCotizacionesDto(
            query.idLead,
            query.estado,
            query.idRemitente,
            query.fechaDesde
                ? startOfDayInZone(query.fechaDesde, this.appTime.timeZone)
                : undefined,
            query.fechaHasta
                ? endOfDayInZone(query.fechaHasta, this.appTime.timeZone)
                : undefined,
            query.page,
            query.limit,
            query.tipo,
            query.idOrg,
        );
        const { data, total } = await this.listCotizacionesUseCase.execute(dto);
        return new PaginatedCotizacionResponseDto(
            data.map((item) => new CotizacionResponseDto(item)),
            total,
            dto.page,
            dto.limit,
        );
    }

    @Get('kpis')
    @ApiOperation({
        summary: 'KPIs de cotizaciones (conteos y monto activo)',
        description:
            'Devuelve conteos por estado y la suma de montos de cotizaciones no rechazadas. ' +
            'Aplica los mismos filtros de leads activos que el listado. ' +
            'Acepta fechaDesde/fechaHasta sobre fechaCot.',
    })
    @ApiResponse({ status: 200, type: KpisCotizacionesResponseDto })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async kpis(
        @Query() query: KpisCotizacionesQueryDto,
    ): Promise<KpisCotizacionesResponseDto> {
        const result = await this.getKpisCotizacionesUseCase.execute({
            fechaDesde: query.fechaDesde
                ? startOfDayInZone(query.fechaDesde, this.appTime.timeZone)
                : undefined,
            fechaHasta: query.fechaHasta
                ? endOfDayInZone(query.fechaHasta, this.appTime.timeZone)
                : undefined,
        });
        return new KpisCotizacionesResponseDto(result);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una cotización por ID' })
    @ApiResponse({
        status: 200,
        description: 'Cotización encontrada',
        type: CotizacionResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CotizacionResponseDto> {
        const result = await this.getCotizacionByIdUseCase.execute(id);
        return new CotizacionResponseDto(result);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar una cotización existente' })
    @ApiResponse({
        status: 200,
        description: 'Cotización actualizada exitosamente',
        type: CotizacionResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
    @ApiResponse({
        status: 409,
        description:
            'No se puede modificar una cotización ACEPTADA o RECHAZADA',
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() httpDto: HttpUpdateCotizacionDto,
    ): Promise<CotizacionResponseDto> {
        const dto = new UpdateCotizacionDto(
            httpDto.fechaCot
                ? startOfDayInZone(httpDto.fechaCot, this.appTime.timeZone)
                : undefined,
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
    @ApiOperation({ summary: 'Marcar una cotización como enviada al cliente' })
    @ApiResponse({
        status: 200,
        description: 'Cotización enviada exitosamente',
        type: CotizacionResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
    @ApiResponse({
        status: 409,
        description: 'Solo se puede enviar una cotización en estado PENDIENTE',
    })
    async send(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CotizacionResponseDto> {
        const result = await this.sendCotizacionUseCase.execute(id);
        return new CotizacionResponseDto(result);
    }

    @Patch(':id/accept')
    @ApiOperation({
        summary: 'Aceptar una cotización',
        description:
            'Cierra el lead asociado como CIERRE_CON_VENTA (requiere que no tenga actividades pendientes).',
    })
    @ApiResponse({
        status: 200,
        description: 'Cotización aceptada exitosamente',
        type: CotizacionResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description: 'Cotización o lead asociado no encontrado',
    })
    @ApiResponse({
        status: 409,
        description:
            'Solo se puede aceptar una cotización en estado PENDIENTE o ENVIADA, o el lead tiene actividades pendientes',
    })
    async accept(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CotizacionResponseDto> {
        const result = await this.acceptCotizacionUseCase.execute(id);
        return new CotizacionResponseDto(result);
    }

    @Patch(':id/reject')
    @ApiOperation({
        summary: 'Rechazar una cotización',
        description:
            'Cierra el lead asociado como CIERRE_SIN_VENTA (requiere que no tenga actividades pendientes).',
    })
    @ApiResponse({
        status: 200,
        description: 'Cotización rechazada exitosamente',
        type: CotizacionResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description: 'Cotización o lead asociado no encontrado',
    })
    @ApiResponse({
        status: 409,
        description:
            'Solo se puede rechazar una cotización en estado PENDIENTE o ENVIADA, o el lead tiene actividades pendientes',
    })
    async reject(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CotizacionResponseDto> {
        const result = await this.rejectCotizacionUseCase.execute(id);
        return new CotizacionResponseDto(result);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar una cotización (eliminación lógica)' })
    @ApiResponse({
        status: 200,
        description: 'Cotización eliminada exitosamente',
        schema: { example: { ok: true } },
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
    async remove(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ ok: boolean }> {
        return await this.deleteCotizacionUseCase.execute(id);
    }
}
