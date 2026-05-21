import { Resend } from 'resend';
import { UserRole } from '@/shared/domain/enums/rol';
import { renderInvitationEmailTemplate } from './invitation-email.renderer';

export class ResendMailProvider {
    private static readonly instance: Resend = (() => {
        const token = process.env.RESEND_TOKEN;
        if (!token) {
            throw new Error('RESEND_TOKEN is required');
        }
        return new Resend(token);
    })();

    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const resend: Resend = ResendMailProvider.instance;

        await resend.emails.send({
            from: 'Bioactiva <no-reply@yiu.lat>',
            to: input.correo,
            subject: 'Invitación a Back Bioactiva',
            html: renderInvitationEmailTemplate(input),
        });
    }
}
