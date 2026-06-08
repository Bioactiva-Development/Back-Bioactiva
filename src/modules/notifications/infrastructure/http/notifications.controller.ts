import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CreateReminderUseCase } from '@/modules/notifications/application/use-cases/create-reminder.use-case';
import { CreateFollowUpUseCase } from '@/modules/notifications/application/use-cases/create-follow-up.use-case';
import { CancelNotificationUseCase } from '@/modules/notifications/application/use-cases/cancel-notification.use-case';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { ListActiveTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-active-templates.use-case';
import { HttpCreateReminderDto } from '@/modules/notifications/infrastructure/http/dto/create-reminder.dto.http';
import { HttpCreateFollowUpDto } from '@/modules/notifications/infrastructure/http/dto/create-follow-up.dto.http';
import { ListNotificationsQueryDto } from '@/modules/notifications/infrastructure/http/dto/list-notifications-query.dto.http';
import { NotificationResponseDto } from '@/modules/notifications/infrastructure/http/dto/notification-response.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly createReminderUseCase: CreateReminderUseCase,
        private readonly createFollowUpUseCase: CreateFollowUpUseCase,
        private readonly cancelNotificationUseCase: CancelNotificationUseCase,
        private readonly listNotificationsUseCase: ListNotificationsUseCase,
        private readonly listActiveTemplatesUseCase: ListActiveTemplatesUseCase,
    ) {}

    @Post('reminders')
    @ApiOperation({
        summary: 'Programar un recordatorio interno al responsable',
    })
    async createReminder(
        @Body() dto: HttpCreateReminderDto,
    ): Promise<NotificationResponseDto> {
        const notification = await this.createReminderUseCase.execute({
            idActividad: dto.idActividad,
            fechaEnvio: dto.fechaEnvio,
            idTemplate: dto.idTemplate,
            asunto: dto.asunto,
            cuerpo: dto.cuerpo,
        });
        return new NotificationResponseDto(notification);
    }

    @Post('follow-ups')
    @ApiOperation({
        summary:
            'Programar un seguimiento (correo interno al responsable y externo al cliente)',
    })
    async createFollowUp(
        @Body() dto: HttpCreateFollowUpDto,
    ): Promise<NotificationResponseDto> {
        const notification = await this.createFollowUpUseCase.execute({
            idActividad: dto.idActividad,
            internal: {
                fechaEnvio: dto.internal.fechaEnvio,
                idTemplate: dto.internal.idTemplate,
                asunto: dto.internal.asunto,
                cuerpo: dto.internal.cuerpo,
            },
            external: {
                correoCliente: dto.external.correoCliente,
                fechaEnvio: dto.external.fechaEnvio,
                idTemplate: dto.external.idTemplate,
                asunto: dto.external.asunto,
                cuerpo: dto.external.cuerpo,
            },
        });
        return new NotificationResponseDto(notification);
    }

    @Get()
    @ApiOperation({ summary: 'Listar notificaciones (Programadas o Vencidas)' })
    async list(
        @Query() query: ListNotificationsQueryDto,
    ): Promise<NotificationResponseDto[]> {
        const notifications = await this.listNotificationsUseCase.execute({
            estado: query.estado,
            idLead: query.idLead,
            idResponsable: query.idResponsable,
        });
        return notifications.map(
            (notification) => new NotificationResponseDto(notification),
        );
    }

    @Get('templates')
    @ApiOperation({
        summary: 'Listar plantillas de correo activas para el selector',
    })
    async listTemplates() {
        return this.listActiveTemplatesUseCase.execute();
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancelar una notificación programada' })
    async cancel(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<NotificationResponseDto> {
        const notification = await this.cancelNotificationUseCase.execute(id);
        return new NotificationResponseDto(notification);
    }
}
