import { EstadoNotificacion } from '@/modules/notifications/domain/enums/estado-notificacion';

export class Notificacion {
    constructor(
        public readonly id: number,
        public titulo: string,
        public mensaje: string,
        public estado: EstadoNotificacion = EstadoNotificacion.NO_LEIDA,
        public id_usuario: number,
        public id_actividad: number,
        public readonly created_at: Date,
    ) {}

    markRead() {
        this.estado = EstadoNotificacion.LEIDA;
    }
}
