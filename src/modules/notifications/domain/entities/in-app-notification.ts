import { InAppNotificationStatus } from '@/modules/notifications/domain/enums/in-app-notification-status';

/** Notificación in-app (la "campana"): mensajes para un usuario dentro del CRM. */
export class InAppNotification {
    constructor(
        public readonly id: number | null,
        public titulo: string,
        public mensaje: string,
        public estado: InAppNotificationStatus,
        public id_usuario: number,
        public id_actividad: number | null,
        public id_lead: number | null,
        public readonly created_at: Date,
    ) {}

    static createLeadAlert(input: {
        idUsuario: number;
        idLead: number;
        titulo: string;
        mensaje: string;
    }): InAppNotification {
        return new InAppNotification(
            null,
            input.titulo,
            input.mensaje,
            InAppNotificationStatus.NO_LEIDA,
            input.idUsuario,
            null,
            input.idLead,
            new Date(),
        );
    }

    markAsRead(): void {
        this.estado = InAppNotificationStatus.LEIDA;
    }
}
