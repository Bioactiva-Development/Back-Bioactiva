import { FollowUpEmailInput } from '@/modules/notifications/application/dto/create-follow-up.command';

export interface EditFollowUpCommand {
    /** ID de la notificación de seguimiento a editar. */
    notificationId: number;
    /**
     * Nuevo correo del cliente. Opcional: si se omite, se conserva el actual.
     * Si se envía, debe pertenecer al contacto del lead.
     */
    correoCliente?: string;
    /** Nuevo correo interno al responsable. */
    internal: FollowUpEmailInput;
    /** Nuevo correo externo al cliente (posterior al interno). */
    external: FollowUpEmailInput;
}
