import { Resend } from 'resend';
import { UserRole } from '@/shared/domain/enums/rol';
import { renderInvitationEmailTemplate } from './invitation-email.renderer';

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

    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const resend = ResendMailProvider.getInstance();

        await resend.emails.send({
            from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM}>`,
            to: input.correo,
            subject: 'Invitación a Back Bioactiva',
            html: renderInvitationEmailTemplate(input),
        });
    }
}
