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
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
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
import { EmailTemplateResponseDto } from '@/modules/notifications/infrastructure/http/dto/email-template-response.dto';

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
        description:
            'El lead debe tener una actividad activa; el recordatorio se envía N minutos antes de que finalice.',
    })
    @ApiResponse({
        status: 201,
        description: 'Recordatorio programado exitosamente',
        type: NotificationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description:
            'minutosAntes inválido o la fecha de envío calculada no es válida',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description:
            'El lead no tiene una actividad activa, o la plantilla indicada no existe/está inactiva',
    })
    @ApiResponse({
        status: 409,
        description: 'La actividad ya tiene una notificación activa',
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
        description:
            'El lead debe tener una actividad activa y el correo del cliente debe pertenecer a uno de sus contactos. Cada instancia exige que el envío externo sea posterior al interno, y las instancias deben estar encadenadas en el tiempo.',
    })
    @ApiResponse({
        status: 201,
        description: 'Seguimiento programado exitosamente',
        type: NotificationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description:
            'Fechas inválidas: el correo externo debe ser posterior al interno, o las instancias no están correctamente encadenadas',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description:
            'El lead no tiene una actividad activa, o alguna plantilla indicada no existe/está inactiva',
    })
    @ApiResponse({
        status: 409,
        description: 'La actividad ya tiene una notificación activa',
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
        description:
            'Cancela los envíos programados previos y los reprograma con los nuevos datos. Solo el responsable de la notificación puede editarla.',
    })
    @ApiResponse({
        status: 200,
        description: 'Seguimiento editado exitosamente',
        type: NotificationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description:
            'Fechas inválidas, o el correo de cliente no pertenece a un contacto del lead',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'La notificación no pertenece al usuario autenticado',
    })
    @ApiResponse({
        status: 404,
        description:
            'Notificación, actividad activa del lead o alguna plantilla no encontrada',
    })
    @ApiResponse({
        status: 409,
        description:
            'El seguimiento no es editable (no está PROGRAMADO o ya tiene correos enviados)',
    })
    async editFollowUp(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: HttpEditFollowUpDto,
        @CurrentUser() user: User,
    ): Promise<NotificationResponseDto> {
        const notification = await this.editFollowUpUseCase.execute({
            notificationId: id,
            requesterId: user.id!,
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
    @ApiOperation({
        summary: 'Listar notificaciones (Programadas o Vencidas)',
        description:
            'Devuelve solo las notificaciones cuyo responsable es el usuario autenticado.',
    })
    @ApiResponse({
        status: 200,
        description: 'Listado paginado de notificaciones',
        type: PaginatedNotificationResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async list(
        @Query() query: ListNotificationsQueryDto,
        @CurrentUser() user: User,
    ): Promise<PaginatedNotificationResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const { data, total } = await this.listNotificationsUseCase.execute({
            estado: query.estado,
            idLead: query.idLead,
            idResponsable: user.id!,
            page,
            limit,
        });
        return new PaginatedNotificationResponseDto(
            data.map(
                (notification) => new NotificationResponseDto(notification),
            ),
            total,
            page,
            limit,
        );
    }

    @Get('templates')
    @ApiOperation({
        summary: 'Listar plantillas de correo activas para el selector',
    })
    @ApiResponse({
        status: 200,
        description: 'Plantillas de correo activas',
        type: [EmailTemplateResponseDto],
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async listTemplates() {
        return this.listActiveTemplatesUseCase.execute();
    }

    @Get('in-app')
    @ApiOperation({
        summary: 'Listar las notificaciones in-app del usuario autenticado',
    })
    @ApiResponse({
        status: 200,
        description: 'Notificaciones in-app del usuario',
        type: [InAppNotificationResponseDto],
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
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
    @ApiResponse({
        status: 200,
        description: 'Notificación marcada como leída',
        type: InAppNotificationResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 404,
        description:
            'Notificación no encontrada o no pertenece al usuario autenticado',
    })
    async markInAppRead(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ): Promise<InAppNotificationResponseDto> {
        const notification =
            await this.markInAppNotificationReadUseCase.execute(id, user.id!);
        return new InAppNotificationResponseDto(notification);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Cancelar una notificación programada',
        description:
            'Cancela los envíos aún pendientes (recordatorio o instancias de seguimiento). Solo el responsable de la notificación puede cancelarla.',
    })
    @ApiResponse({
        status: 200,
        description: 'Notificación cancelada exitosamente',
        type: NotificationResponseDto,
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'La notificación no pertenece al usuario autenticado',
    })
    @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
    @ApiResponse({
        status: 409,
        description: 'La notificación ya está vencida o cancelada',
    })
    async cancel(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ): Promise<NotificationResponseDto> {
        const notification = await this.cancelNotificationUseCase.execute(
            id,
            user.id!,
        );
        return new NotificationResponseDto(notification);
    }
}
