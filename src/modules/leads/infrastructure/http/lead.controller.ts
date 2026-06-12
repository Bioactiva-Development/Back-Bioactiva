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
import { CreateLeadUseCase } from '@/modules/leads/application/use-cases/create-lead.use-case';
import { GetLeadByIdUseCase } from '@/modules/leads/application/use-cases/get-lead-by-id.use-case';
import { ListLeadsUseCase } from '@/modules/leads/application/use-cases/list-leads.use-case';
import { UpdateLeadUseCase } from '@/modules/leads/application/use-cases/update-lead.use-case';
import { ChangeLeadStatusUseCase } from '@/modules/leads/application/use-cases/change-lead-status.use-case';
import { DeleteLeadUseCase } from '@/modules/leads/application/use-cases/delete-lead.use-case';
import { HttpCreateLeadDto } from '@/modules/leads/infrastructure/http/dto/create-lead.dto.http';
import { HttpUpdateLeadDto } from '@/modules/leads/infrastructure/http/dto/update-lead.dto.http';
import { HttpChangeLeadStatusDto } from '@/modules/leads/infrastructure/http/dto/change-lead-status.dto.http';
import { ListLeadsQueryDto } from '@/modules/leads/infrastructure/http/dto/list-leads-query.dto.http';
import { LeadResponseDto } from '@/modules/leads/infrastructure/http/dto/lead-response.dto';
import { PaginatedLeadResponseDto } from '@/modules/leads/infrastructure/http/dto/paginated-lead-response.dto';
import { CreateLeadDto } from '@/modules/leads/application/dto/create-lead.dto';
import { UpdateLeadDto } from '@/modules/leads/application/dto/update-lead.dto';
import { ChangeLeadStatusDto } from '@/modules/leads/application/dto/change-lead-status.dto';
import { ListLeadsDto } from '@/modules/leads/application/dto/list-leads.dto';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadController {
    constructor(
        private readonly createLeadUseCase: CreateLeadUseCase,
        private readonly getLeadByIdUseCase: GetLeadByIdUseCase,
        private readonly listLeadsUseCase: ListLeadsUseCase,
        private readonly updateLeadUseCase: UpdateLeadUseCase,
        private readonly changeLeadStatusUseCase: ChangeLeadStatusUseCase,
        private readonly deleteLeadUseCase: DeleteLeadUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo lead' })
    @ApiResponse({
        status: 201,
        description: 'Lead creado exitosamente',
        type: LeadResponseDto,
    })
    async create(
        @Body() httpDto: HttpCreateLeadDto,
        @CurrentUser() user: User,
    ): Promise<LeadResponseDto> {
        const createDto = new CreateLeadDto(
            httpDto.idOrg,
            httpDto.idContacto ?? null,
            httpDto.servicioInteres,
            httpDto.comentarios ?? null,
            httpDto.desafioOportunidad ?? null,
            httpDto.notasContacto ?? null,
            httpDto.canalCaptacion ?? null,
            httpDto.idEncargado,
            user.id!,
        );
        const result = await this.createLeadUseCase.execute(createDto);
        return new LeadResponseDto(result);
    }

    @Get()
    @ApiOperation({ summary: 'Listar leads con filtros y paginación' })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de leads',
        type: PaginatedLeadResponseDto,
    })
    async findAll(
        @Query() query: ListLeadsQueryDto,
    ): Promise<PaginatedLeadResponseDto> {
        const dto = new ListLeadsDto(
            query.estado,
            query.idOrg,
            query.idEncargado,
            query.search,
            query.page,
            query.limit,
            query.alertaActividad,
            query.fechaDesde ? new Date(query.fechaDesde) : undefined,
            query.fechaHasta ? new Date(query.fechaHasta) : undefined,
        );
        const { data, total } = await this.listLeadsUseCase.execute(dto);
        const responseData = data.map((item) => new LeadResponseDto(item));
        return new PaginatedLeadResponseDto(
            responseData,
            total,
            dto.page,
            dto.limit,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un lead por ID' })
    @ApiResponse({
        status: 200,
        description: 'Lead encontrado',
        type: LeadResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Lead no encontrado' })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<LeadResponseDto> {
        const result = await this.getLeadByIdUseCase.execute(id);
        return new LeadResponseDto(result);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un lead existente' })
    @ApiResponse({
        status: 200,
        description: 'Lead actualizado exitosamente',
        type: LeadResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Lead no encontrado' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() httpDto: HttpUpdateLeadDto,
    ): Promise<LeadResponseDto> {
        const updateDto = new UpdateLeadDto(
            httpDto.idOrg,
            httpDto.idContacto,
            httpDto.servicioInteres,
            httpDto.comentarios,
            httpDto.desafioOportunidad,
            httpDto.notasContacto,
            httpDto.canalCaptacion,
            httpDto.idEncargado,
        );
        const result = await this.updateLeadUseCase.execute(id, updateDto);
        return new LeadResponseDto(result);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Cambiar el estado de un lead' })
    @ApiResponse({
        status: 200,
        description: 'Estado actualizado exitosamente',
        type: LeadResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Lead no encontrado' })
    @ApiResponse({
        status: 409,
        description:
            'El lead tiene actividades pendientes; deben resolverse antes de cambiar de estado',
    })
    async changeStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() httpDto: HttpChangeLeadStatusDto,
    ): Promise<LeadResponseDto> {
        const dto = new ChangeLeadStatusDto(httpDto.estado);
        const result = await this.changeLeadStatusUseCase.execute(id, dto);
        return new LeadResponseDto(result);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un lead (eliminación lógica)' })
    @ApiResponse({ status: 200, description: 'Lead eliminado exitosamente' })
    @ApiResponse({ status: 404, description: 'Lead no encontrado' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return await this.deleteLeadUseCase.execute(id);
    }
}
