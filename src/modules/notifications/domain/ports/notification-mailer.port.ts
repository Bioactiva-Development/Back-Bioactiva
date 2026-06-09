export const NOTIFICATION_MAILER = Symbol('NOTIFICATION_MAILER');

/** Envío de un correo arbitrario (asunto/cuerpo ya renderizados). */
export interface NotificationMailerPort {
    send(input: { to: string; subject: string; html: string }): Promise<void>;
}
