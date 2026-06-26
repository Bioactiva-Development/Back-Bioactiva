import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/jwt/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';
import { CreateReminderUseCase } from '@/modules/notifications/application/use-cases/create-reminder.use-case';
import { CreateFollowUpUseCase } from '@/modules/notifications/application/use-cases/create-follow-up.use-case';
import { EditFollowUpUseCase } from '@/modules/notifications/application/use-cases/edit-follow-up.use-case';
import { CancelNotificationUseCase } from '@/modules/notifications/application/use-cases/cancel-notification.use-case';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { ListActiveTemplatesUseCase } from '@/modules/notifications/application/use-cases/list-active-templates.use-case';
import { ListInAppNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-in-app-notifications.use-case';
import { MarkInAppNotificationReadUseCase } from '@/modules/notifications/application/use-cases/mark-in-app-notification-read.use-case';
import { HttpCreateReminderDto } from '@/modules/notifications/infrastructure/http/dto/create-reminder.dto.http';
import { HttpCreateFollowUpDto } from '@/modules/notifications/infrastructure/http/dto/create-follow-up.dto.http';
import { HttpEditFollowUpDto } from '@/modules/notifications/infrastructure/http/dto/edit-follow-up.dto.http';
import { ListNotificationsQueryDto } from '@/modules/notifications/infrastructure/http/dto/list-notifications-query.dto.http';
import { NotificationResponseDto } from '@/modules/notifications/infrastructure/http/dto/notification-response.dto';
import { PaginatedNotificationResponseDto } from '@/modules/notifications/infrastructure/http/dto/paginated-notification-response.dto';
import { InAppNotificationResponseDto } from '@/modules/notifications/infrastructure/http/dto/in-app-notification-response.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly createReminderUseCase: CreateReminderUseCase,
        private readonly createFollowUpUseCase: CreateFollowUpUseCase,
        private readonly editFollowUpUseCase: EditFollowUpUseCase,
        private readonly cancelNotificationUseCase: CancelNotificationUseCase,
        private readonly listNotificationsUseCase: ListNotificationsUseCase,
        private readonly listActiveTemplatesUseCase: ListActiveTemplatesUseCase,
        private readonly listInAppNotificationsUseCase: ListInAppNotificationsUseCase,
        private readonly markInAppNotificationReadUseCase: MarkInAppNotificationReadUseCase,
    ) {}

    @Post('reminders')
    @ApiOperation({
        summary: 'Programar un recordatorio interno al responsable',
    })
    async createReminder(
        @Body() dto: HttpCreateReminderDto,
    ): Promise<NotificationResponseDto> {
        const notification = await this.createReminderUseCase.execute({
            idLead: dto.idLead,
            minutosAntes: dto.minutosAntes,
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
            idLead: dto.idLead,
            correoCliente: dto.correoCliente,
            instancias: dto.instancias.map((instancia) => ({
                internal: {
                    fechaEnvio: instancia.internal.fechaEnvio,
                    idTemplate: instancia.internal.idTemplate,
                    asunto: instancia.internal.asunto,
                    cuerpo: instancia.internal.cuerpo,
                },
                external: {
                    fechaEnvio: instancia.external.fechaEnvio,
                    idTemplate: instancia.external.idTemplate,
                    asunto: instancia.external.asunto,
                    cuerpo: instancia.external.cuerpo,
                },
            })),
        });
        return new NotificationResponseDto(notification);
    }

    @Patch('follow-ups/:id')
    @ApiOperation({
        summary:
            'Editar el seguimiento programado (su única instancia, antes de enviarse)',
    })
    async editFollowUp(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: HttpEditFollowUpDto,
    ): Promise<NotificationResponseDto> {
        const notification = await this.editFollowUpUseCase.execute({
            notificationId: id,
            correoCliente: dto.correoCliente,
            internal: {
                fechaEnvio: dto.internal.fechaEnvio,
                idTemplate: dto.internal.idTemplate,
                asunto: dto.internal.asunto,
                cuerpo: dto.internal.cuerpo,
            },
            external: {
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
    ): Promise<PaginatedNotificationResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const { data, total } = await this.listNotificationsUseCase.execute({
            estado: query.estado,
            idLead: query.idLead,
            idResponsable: query.idResponsable,
            page,
            limit,
        });
        return new PaginatedNotificationResponseDto(
            data.map((notification) => new NotificationResponseDto(notification)),
            total,
            page,
            limit,
        );
    }

    @Get('templates')
    @ApiOperation({
        summary: 'Listar plantillas de correo activas para el selector',
    })
    async listTemplates() {
        return this.listActiveTemplatesUseCase.execute();
    }

    @Get('in-app')
    @ApiOperation({
        summary: 'Listar las notificaciones in-app del usuario autenticado',
    })
    async listInApp(
        @CurrentUser() user: User,
    ): Promise<InAppNotificationResponseDto[]> {
        const notifications = await this.listInAppNotificationsUseCase.execute(
            user.id!,
        );
        return notifications.map(
            (notification) => new InAppNotificationResponseDto(notification),
        );
    }

    @Patch('in-app/:id/read')
    @ApiOperation({ summary: 'Marcar una notificación in-app como leída' })
    async markInAppRead(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ): Promise<InAppNotificationResponseDto> {
        const notification =
            await this.markInAppNotificationReadUseCase.execute(id, user.id!);
        return new InAppNotificationResponseDto(notification);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancelar una notificación programada' })
    async cancel(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ): Promise<NotificationResponseDto> {
        const notification = await this.cancelNotificationUseCase.execute(id, user.id!);
        return new NotificationResponseDto(notification);
    }
}
