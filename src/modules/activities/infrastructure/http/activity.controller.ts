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
import { CreateActivityUseCase } from '@/modules/activities/application/use-cases/create-activity.use-case';
import { GetActivityByIdUseCase } from '@/modules/activities/application/use-cases/get-activity-by-id.use-case';
import { ListActivitiesUseCase } from '@/modules/activities/application/use-cases/list-activities.use-case';
import { UpdateActivityUseCase } from '@/modules/activities/application/use-cases/update-activity.use-case';
import { CompleteActivityUseCase } from '@/modules/activities/application/use-cases/complete-activity.use-case';
import { CancelActivityUseCase } from '@/modules/activities/application/use-cases/cancel-activity.use-case';
import { DeleteActivityUseCase } from '@/modules/activities/application/use-cases/delete-activity.use-case';
import { HttpCreateActivityDto } from '@/modules/activities/infrastructure/http/dto/create-activity.dto.http';
import { HttpUpdateActivityDto } from '@/modules/activities/infrastructure/http/dto/update-activity.dto.http';
import { ListActivitiesQueryDto } from '@/modules/activities/infrastructure/http/dto/list-activities-query.dto.http';
import { ActivityResponseDto } from '@/modules/activities/infrastructure/http/dto/activity-response.dto';
import { PaginatedActivityResponseDto } from '@/modules/activities/infrastructure/http/dto/paginated-activity-response.dto';
import { CreateActivityDto } from '@/modules/activities/application/dto/create-activity.dto';
import { UpdateActivityDto } from '@/modules/activities/application/dto/update-activity.dto';
import { ListActivitiesDto } from '@/modules/activities/application/dto/list-activities.dto';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivityController {
    constructor(
        private readonly createActivityUseCase: CreateActivityUseCase,
        private readonly getActivityByIdUseCase: GetActivityByIdUseCase,
        private readonly listActivitiesUseCase: ListActivitiesUseCase,
        private readonly updateActivityUseCase: UpdateActivityUseCase,
        private readonly completeActivityUseCase: CompleteActivityUseCase,
        private readonly cancelActivityUseCase: CancelActivityUseCase,
        private readonly deleteActivityUseCase: DeleteActivityUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Crear una nueva actividad' })
    @ApiResponse({
        status: 201,
        description: 'Actividad creada exitosamente',
        type: ActivityResponseDto,
    })
    async create(
        @Body() httpDto: HttpCreateActivityDto,
    ): Promise<ActivityResponseDto> {
        const createDto = new CreateActivityDto(
            httpDto.idLead,
            httpDto.nombreActividad,
            httpDto.fechaInicio,
            httpDto.fechaFin,
            httpDto.tipo,
            httpDto.notas ?? null,
            httpDto.idResponsable,
        );
        const result = await this.createActivityUseCase.execute(createDto);
        return new ActivityResponseDto(result);
    }

    @Get()
    @ApiOperation({ summary: 'Listar actividades con filtros y paginación' })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de actividades',
        type: PaginatedActivityResponseDto,
    })
    async findAll(
        @Query() query: ListActivitiesQueryDto,
    ): Promise<PaginatedActivityResponseDto> {
        const dto = new ListActivitiesDto(
            query.idLead,
            query.idResponsable,
            query.estado,
            query.tipo,
            query.fechaInicio,
            query.fechaFin,
            query.page,
            query.limit,
        );
        const { data, total } = await this.listActivitiesUseCase.execute(dto);
        const responseData = data.map((item) => new ActivityResponseDto(item));
        return new PaginatedActivityResponseDto(
            responseData,
            total,
            dto.page,
            dto.limit,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una actividad por ID' })
    @ApiResponse({
        status: 200,
        description: 'Actividad encontrada',
        type: ActivityResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<ActivityResponseDto> {
        const result = await this.getActivityByIdUseCase.execute(id);
        return new ActivityResponseDto(result);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar una actividad existente' })
    @ApiResponse({
        status: 200,
        description: 'Actividad actualizada exitosamente',
        type: ActivityResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() httpDto: HttpUpdateActivityDto,
    ): Promise<ActivityResponseDto> {
        const updateDto = new UpdateActivityDto(
            httpDto.nombreActividad,
            httpDto.fechaInicio,
            httpDto.fechaFin,
            httpDto.notas,
            httpDto.idResponsable,
        );
        const result = await this.updateActivityUseCase.execute(id, updateDto);
        return new ActivityResponseDto(result);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Marcar una actividad como realizada' })
    @ApiResponse({
        status: 200,
        description: 'Actividad completada exitosamente',
        type: ActivityResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
    async complete(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<ActivityResponseDto> {
        const result = await this.completeActivityUseCase.execute(id);
        return new ActivityResponseDto(result);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancelar una actividad' })
    @ApiResponse({
        status: 200,
        description: 'Actividad cancelada exitosamente',
        type: ActivityResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
    async cancel(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<ActivityResponseDto> {
        const result = await this.cancelActivityUseCase.execute(id);
        return new ActivityResponseDto(result);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar una actividad (eliminación lógica)' })
    @ApiResponse({
        status: 200,
        description: 'Actividad eliminada exitosamente',
    })
    @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return await this.deleteActivityUseCase.execute(id);
    }
}
