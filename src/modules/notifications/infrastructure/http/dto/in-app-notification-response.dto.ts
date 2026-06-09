import { ApiProperty } from '@nestjs/swagger';
import { InAppNotification } from '@/modules/notifications/domain/entities/in-app-notification';
import { InAppNotificationStatus } from '@/modules/notifications/domain/enums/in-app-notification-status';

export class InAppNotificationResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    titulo: string;

    @ApiProperty()
    mensaje: string;

    @ApiProperty({ enum: InAppNotificationStatus })
    estado: InAppNotificationStatus;

    @ApiProperty({ nullable: true })
    idLead: number | null;

    @ApiProperty({ nullable: true })
    idActividad: number | null;

    @ApiProperty()
    createdAt: Date;

    constructor(notification: InAppNotification) {
        this.id = notification.id!;
        this.titulo = notification.titulo;
        this.mensaje = notification.mensaje;
        this.estado = notification.estado;
        this.idLead = notification.id_lead;
        this.idActividad = notification.id_actividad;
        this.createdAt = notification.created_at;
    }
}
