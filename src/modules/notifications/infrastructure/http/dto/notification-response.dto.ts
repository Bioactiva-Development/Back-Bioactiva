import { ApiProperty } from '@nestjs/swagger';
import { ScheduledNotification } from '@/modules/notifications/domain/entities/scheduled-notification';
import { FollowUpInstance } from '@/modules/notifications/domain/entities/follow-up-instance';
import { NotificationStatus } from '@/modules/notifications/domain/enums/notification-status';
import { NotificationType } from '@/modules/notifications/domain/enums/notification-type';

export class FollowUpInstanceResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    orden: number;

    @ApiProperty()
    asuntoInterno: string;

    @ApiProperty()
    fechaEnvioInterno: Date;

    @ApiProperty()
    enviadoInterno: boolean;

    @ApiProperty()
    asuntoExterno: string;

    @ApiProperty()
    fechaEnvioExterno: Date;

    @ApiProperty()
    enviadoExterno: boolean;

    constructor(instancia: FollowUpInstance) {
        this.id = instancia.id!;
        this.orden = instancia.orden;
        this.asuntoInterno = instancia.asunto_interno;
        this.fechaEnvioInterno = instancia.fecha_envio_interno;
        this.enviadoInterno = instancia.enviado_interno;
        this.asuntoExterno = instancia.asunto_externo;
        this.fechaEnvioExterno = instancia.fecha_envio_externo;
        this.enviadoExterno = instancia.enviado_externo;
    }
}

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

    @ApiProperty({ nullable: true, description: 'Solo RECORDATORIO' })
    asuntoInterno: string | null;

    @ApiProperty({ nullable: true, description: 'Solo RECORDATORIO' })
    fechaEnvioInterno: Date | null;

    @ApiProperty()
    enviadoInterno: boolean;

    @ApiProperty({ nullable: true, description: 'Solo SEGUIMIENTO' })
    correoCliente: string | null;

    @ApiProperty({
        type: [FollowUpInstanceResponseDto],
        description: 'Instancias del seguimiento (vacío en un recordatorio)',
    })
    instancias: FollowUpInstanceResponseDto[];

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
        this.instancias = notification.instancias.map(
            (instancia) => new FollowUpInstanceResponseDto(instancia),
        );
        this.createdAt = notification.created_at;
    }
}
