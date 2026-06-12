import { ApiProperty } from '@nestjs/swagger';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';

export class NotificationResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty({ enum: NotificationType })
    tipo: NotificationType;

    @ApiProperty({ enum: NotificationStatus })
    estado: NotificationStatus;

    @ApiProperty()
    idActividad: number;

    @ApiProperty()
    idLead: number;

    @ApiProperty()
    idResponsable: number;

    @ApiProperty()
    asuntoInterno: string;

    @ApiProperty()
    fechaEnvioInterno: Date;

    @ApiProperty()
    enviadoInterno: boolean;

    @ApiProperty({ nullable: true })
    correoCliente: string | null;

    @ApiProperty({ nullable: true })
    asuntoExterno: string | null;

    @ApiProperty({ nullable: true })
    fechaEnvioExterno: Date | null;

    @ApiProperty()
    enviadoExterno: boolean;

    @ApiProperty()
    createdAt: Date;

    constructor(notification: ScheduledNotification) {
        this.id = notification.id!;
        this.tipo = notification.tipo;
        this.estado = notification.estado;
        this.idActividad = notification.id_actividad;
        this.idLead = notification.id_lead;
        this.idResponsable = notification.id_responsable;
        this.asuntoInterno = notification.asunto_interno;
        this.fechaEnvioInterno = notification.fecha_envio_interno;
        this.enviadoInterno = notification.enviado_interno;
        this.correoCliente = notification.correo_cliente;
        this.asuntoExterno = notification.asunto_externo;
        this.fechaEnvioExterno = notification.fecha_envio_externo;
        this.enviadoExterno = notification.enviado_externo;
        this.createdAt = notification.created_at;
    }
}
