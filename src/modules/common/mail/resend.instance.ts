import { Resend } from 'resend';
import { UserRole } from '@/shared/domain/enums/rol';
import { renderInvitationEmailTemplate } from './invitation-email.renderer';
import { renderResetPasswordEmailTemplate } from './reset-password-email.renderer';

export class ResendMailProvider {
    private static instance: Resend | null = null;

    private static getInstance(): Resend {
        if (ResendMailProvider.instance) {
            return ResendMailProvider.instance;
        }

        const token = process.env.RESEND_TOKEN;
        if (!token) {
            throw new Error('RESEND_TOKEN is required');
        }

        ResendMailProvider.instance = new Resend(token);

        return ResendMailProvider.instance;
    }

    // El SDK de Resend NO lanza ante un fallo de la API: resuelve con
    // `{ data, error }`. Si no se inspecciona `error`, un rechazo (dominio no
    // verificado, destinatario inválido, token sin permisos) se traga en
    // silencio y el envío parece exitoso. Aquí se valida y se lanza para que el
    // job de la cola falle con el motivo real en vez de marcarse "completado".
    private static async dispatch(input: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void> {
        const resend = ResendMailProvider.getInstance();

        const { error } = await resend.emails.send({
            from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM}>`,
            to: input.to,
            subject: input.subject,
            html: input.html,
        });

        if (error) {
            throw new Error(
                `Resend rechazó el envío a ${input.to}: ${error.message}`,
            );
        }
    }

    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        await ResendMailProvider.dispatch({
            to: input.correo,
            subject: 'Invitación a Back Bioactiva',
            html: renderInvitationEmailTemplate(input),
        });
    }

    async sendResetPasswordEmail(input: {
        correo: string;
        token: string;
    }): Promise<void> {
        await ResendMailProvider.dispatch({
            to: input.correo,
            subject: 'Restablecer contraseña - Bioactiva',
            html: renderResetPasswordEmailTemplate(input),
        });
    }

    async sendGenericEmail(input: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void> {
        await ResendMailProvider.dispatch(input);
    }
}
