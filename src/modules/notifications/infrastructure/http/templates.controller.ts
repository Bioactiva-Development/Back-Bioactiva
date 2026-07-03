import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CreateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/create-email-template.use-case';
import { UpdateEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/update-email-template.use-case';
import { GetEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/get-email-template.use-case';
import { ListEmailTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-email-templates.use-case';
import { DeleteEmailTemplateUseCase } from '@/modules/notifications/application/use-cases/delete-email-template.use-case';
import { HttpCreateEmailTemplateDto } from '@/modules/notifications/infrastructure/http/dto/create-email-template.dto.http';
import { HttpUpdateEmailTemplateDto } from '@/modules/notifications/infrastructure/http/dto/update-email-template.dto.http';
import { ListTemplatesQueryDto } from '@/modules/notifications/infrastructure/http/dto/list-templates-query.dto.http';
import { EmailTemplateResponseDto } from '@/modules/notifications/infrastructure/http/dto/email-template-response.dto';

@ApiTags('email-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
    constructor(
        private readonly createEmailTemplateUseCase: CreateEmailTemplateUseCase,
        private readonly updateEmailTemplateUseCase: UpdateEmailTemplateUseCase,
        private readonly getEmailTemplateUseCase: GetEmailTemplateUseCase,
        private readonly listEmailTemplatesUseCase: ListEmailTemplatesUseCase,
        private readonly deleteEmailTemplateUseCase: DeleteEmailTemplateUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Crear una plantilla de correo' })
    @ApiResponse({
        status: 201,
        description: 'Plantilla creada exitosamente',
        type: EmailTemplateResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 409,
        description: 'Ya existe una plantilla con ese nombre',
    })
    async create(
        @Body() dto: HttpCreateEmailTemplateDto,
    ): Promise<EmailTemplateResponseDto> {
        const template = await this.createEmailTemplateUseCase.execute({
            nombre: dto.nombre,
            asunto: dto.asunto,
            cuerpo: dto.cuerpo,
            activo: dto.activo,
        });
        return new EmailTemplateResponseDto(template);
    }

    @Get()
    @ApiOperation({ summary: 'Listar plantillas de correo' })
    @ApiResponse({
        status: 200,
        description: 'Listado de plantillas',
        type: [EmailTemplateResponseDto],
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async list(
        @Query() query: ListTemplatesQueryDto,
    ): Promise<EmailTemplateResponseDto[]> {
        const templates = await this.listEmailTemplatesUseCase.execute(
            query.includeInactive ?? false,
        );
        return templates.map(
            (template) => new EmailTemplateResponseDto(template),
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener el detalle de una plantilla' })
    @ApiResponse({
        status: 200,
        description: 'Plantilla encontrada',
        type: EmailTemplateResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
    async get(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<EmailTemplateResponseDto> {
        const template = await this.getEmailTemplateUseCase.execute(id);
        return new EmailTemplateResponseDto(template);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar o desactivar una plantilla' })
    @ApiResponse({
        status: 200,
        description: 'Plantilla actualizada exitosamente',
        type: EmailTemplateResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
    @ApiResponse({
        status: 409,
        description: 'Ya existe otra plantilla con ese nombre',
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: HttpUpdateEmailTemplateDto,
    ): Promise<EmailTemplateResponseDto> {
        const template = await this.updateEmailTemplateUseCase.execute(id, {
            nombre: dto.nombre,
            asunto: dto.asunto,
            cuerpo: dto.cuerpo,
            activo: dto.activo,
        });
        return new EmailTemplateResponseDto(template);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({
        summary:
            'Eliminar una plantilla (no permitido si está asociada a una notificación)',
    })
    @ApiResponse({
        status: 204,
        description: 'Plantilla eliminada exitosamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
    @ApiResponse({
        status: 409,
        description: 'La plantilla está en uso por una notificación',
    })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.deleteEmailTemplateUseCase.execute(id);
    }
}
